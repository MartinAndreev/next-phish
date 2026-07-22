# Code Context

## Files Retrieved

1. `packages/backend/src/campaign/repositories/campaign.repository.ts` (lines 303-424) — schedule creation/update/cancellation transaction behavior.
2. `packages/backend/src/campaign/repositories/campaign.repository.ts` (lines 481-672) — the only occurrence materializer and shadow-copy transaction.
3. `packages/backend/src/campaign/commands/materialize-occurrence.command.ts` (lines 1-22) — thin command delegation to the repository.
4. `packages/backend/src/campaign/campaign-service.provider.ts` (lines 1-52) — registers the materialize command in TypeDI.
5. `apps/next-app/src/server/modules/campaign/campaign.router.ts` (lines 1-155, 156-174) — exposes schedule CRUD only; does not expose materialization or enqueue it.
6. `packages/database/prisma/schema.prisma` (lines 625-723) — Campaign, Schedule, and ScheduleSource persistence model and indexes.
7. `packages/database/prisma/migrations/20260722120000_campaigns_and_scheduling/migration.sql` (lines 152-242, 280-309) — physical unique/index/check constraints.
8. `apps/next-app/src/server/queue.ts` (lines 1-5) — application creates only `jobs` and `imports` queues.
9. `apps/worker/src/index.ts` (lines 1-76) — worker creates only `jobs` (concurrency 5) and `imports` (concurrency 3) workers; handler maps contain imports only.
10. `apps/next-app/src/server/modules/page/page.router.ts` (lines 112-139) and `apps/next-app/src/server/modules/target-group/target-group.router.ts` (lines 147-165) — all current queue producers.
11. `packages/backend/tests/campaign/campaign.repository.test.ts` (lines 216-274) — sequential idempotency test coverage.

## Key Code

### Current materialization flow

- A create-schedule request enters the campaign tRPC router, dispatches `CreateScheduleCommand`, then `CampaignRepository.createSchedule`. The repository validates sources, calculates a SHA-256 fingerprint, **looks up** a non-cancelled fingerprint collision only to return `collisionWarning`, and inserts a `SCHEDULED` schedule with `nextOccurrenceAt = startsAt` and ordered `ScheduleSource` rows (`campaign.repository.ts:307-346`).
- The repository has `materializeOccurrence(scheduleId, sourceCampaignId, occurrenceAt, organizationId, createdById)` behind `MaterializeOccurrenceCommand` (`commands/materialize-occurrence.command.ts:3-22`) and it is registered in DI (`campaign-service.provider.ts:24,49`).
- Materialization is a single Prisma transaction: it verifies the schedule is in `SCHEDULED`/`RUNNING` and that the submitted source belongs to it; reads a pre-existing `(scheduleId, occurrenceAt)` campaign; validates catalog source assets/target group; creates a `SCHEDULED` concrete campaign; snapshots attachments/email/page/profile/target group as `SHADOW` resources; then wires those snapshot IDs onto the run (`campaign.repository.ts:488-672`). File bytes are shared through `storedObjectId`; metadata/link rows are copied.
- No code in this repository invokes that command in production. The campaign router does not import or route it (`campaign.router.ts:1-174`); neither schedule creation/update nor any queue producer calls it. `nextOccurrenceAt` is set on create/update and cleared on cancel (`campaign.repository.ts:329,387,421`) but is never advanced. There is no recurrence calculation, schedule polling, delayed/repeat job, or completion transition for schedules.

### Prisma guarantees

- `Campaign` has nullable `scheduleId` and `occurrenceAt`, plus `@@unique([scheduleId, occurrenceAt])`; this is the database unique index `campaign_scheduleId_occurrenceAt_key` (`schema.prisma:639-665`; migration lines 217-224). For non-null materialized inputs, it prevents more than one run for a schedule and exact occurrence timestamp.
- `ScheduleSource` has a composite primary key `(scheduleId,campaignId)` and a unique `(scheduleId,position)`, preventing duplicate source membership and source-position collisions (`schema.prisma:710-723`; migration lines 190-197, 238-242).
- Schedule fingerprint has only a non-unique index (`schema.prisma:704-706`; migration lines 229-236); it is explicitly not an idempotency constraint.
- The migration provides positive/range checks for scheduling numeric fields, but does not encode recurrence semantics, status transitions, schedule source eligibility, or an occurrence-claim/lease (`migration.sql:280-309`).

### BullMQ setup and producers

- The Next app instantiates `jobs` and `imports` queues only (`apps/next-app/src/server/queue.ts:1-5`).
- Worker maps accept `site_import` on `jobs` and `target_group_import` on `imports`; unknown names log a warning and return successfully. No campaign/schedule handler, queue, scheduler, QueueEvents, or delayed/repeat-job setup exists (`apps/worker/src/index.ts:13-76`).
- `page.importFromUrl` produces `site_import`; `target-group.importUsers` produces `target_group_import`. Both have one attempt and retention settings, with no `jobId`, deduplication option, backoff, or outbox transaction (`page.router.ts:125-136`; `target-group.router.ts:139-159`). No campaign/schedule producer exists.

## Architecture

The UI/API schedule CRUD path is Next tRPC -> MessageBus -> command -> `CampaignRepository` -> PostgreSQL. BullMQ is a separate Next producer/worker pipeline used only for site and target-group imports. The occurrence materializer currently lives solely in the backend domain layer and can be resolved from TypeDI, but nothing bridges persisted schedules to it. Consequently, saving a schedule produces no campaign run without an external/direct caller.

## Review Findings

1. **Blocker — no runtime schedule materialization path:** `apps/worker/src/index.ts:13-57`, `apps/next-app/src/server/queue.ts:1-5`, and `apps/next-app/src/server/modules/campaign/campaign.router.ts:1-174` contain no schedule queue/handler/producer; `nextOccurrenceAt` has no reader/advancer. Schedules remain persisted metadata and no occurrence is generated automatically.
2. **High — duplicate delivery can surface as an error rather than be idempotently acknowledged:** `packages/backend/src/campaign/repositories/campaign.repository.ts:505-563` implements check-then-create. The database unique constraint prevents duplicate runs, but two concurrent transactions can both miss `existing`; one `create` wins and the other receives Prisma unique violation (P2002), rolling back instead of returning the existing campaign. The test is sequential only (`packages/backend/tests/campaign/campaign.repository.test.ts:238-257`).
3. **High — schedule lifecycle changes race materialization:** `campaign.repository.ts:355-400`, `403-424`, and `488-503` perform ordinary reads/updates inside independent transactions with no row lock, optimistic revision, conditional status update, or occurrence claim. A materializer that read an eligible schedule/source can commit a new `SCHEDULED` run concurrently with cancellation/update; cancellation's `updateMany` can miss that newly committed run. Updating also deletes scheduled runs/sources while a materializer may be using a prior snapshot.
4. **Medium — duplicate schedule detection is advisory and racy:** `campaign.repository.ts:313-345` detects a fingerprint collision but always creates the schedule; schema/migration define only a non-unique fingerprint index (`schema.prisma:704-706`; migration lines 229-236). Concurrent identical creates both produce schedules and normally return no collision warning.
5. **Medium — queue producer/database writes are not atomic:** existing producers persist a DB job through a command and only afterwards call `Queue.add` (`page.router.ts:119-136`; `target-group.router.ts:123-159`). A process/Redis failure between them leaves an unqueued job; retries can enqueue duplicates because no stable BullMQ `jobId` is supplied. This affects only current import queues but is a relevant pattern to avoid for schedule materialization.
6. **Low — worker unknown job names are silently marked successful:** `apps/worker/src/index.ts:32-36,48-52` warns then returns, so a mistakenly enqueued schedule job would not fail/retry or mark a DB failure.

## Residual Risks

- PostgreSQL unique indexes treat NULL values as distinct; the campaign composite unique key does not prevent multiple rows where `scheduleId` or `occurrenceAt` is null. Current materialization provides non-null values, so this is not a duplicate-run hole unless a future write path omits either field.
- The materializer validates source resource states at execution time and snapshots in its transaction, but there is no durable record of failed/broken materialization (despite `brokenAt`/`brokenReason` fields) and no retry policy because there is no consumer.
- `maxCampaigns`, recurrence fields, `endsAt`, selection strategy, and `nextOccurrenceAt` are persisted/validated but currently unenforced at runtime.

## Start Here

Start with `apps/worker/src/index.ts`: it establishes conclusively that no schedule worker exists. Then inspect `packages/backend/src/campaign/repositories/campaign.repository.ts:481-672` to integrate a scheduler with the actual materialization/idempotency boundary.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete flow, schema, worker/producer findings, severity-ranked review findings, and exact paths/line ranges are documented above."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "repository targeted find/grep/read and nl inspection",
      "result": "passed",
      "summary": "Located and inspected campaign repository, Prisma schema/migration, worker, queues, producers, router, and sequential idempotency test."
    }
  ],
  "validationOutput": [
    "No code was edited; no test suite was run because the task was inspection-only."
  ],
  "residualRisks": [
    "No runtime schedule materializer exists.",
    "Concurrent materialization can raise a unique violation rather than return the existing run.",
    "Update/cancel and materialization have uncoordinated transaction races."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository source changes; wrote the required scout artifact only.",
  "reviewFindings": [
    "blocker: apps/worker/src/index.ts:13-57 - no campaign/schedule handler; schedules are never automatically materialized.",
    "high: packages/backend/src/campaign/repositories/campaign.repository.ts:505-563 - check-then-create races and exposes P2002 on duplicate delivery.",
    "high: packages/backend/src/campaign/repositories/campaign.repository.ts:355-424,488-503 - update/cancel race materialization without locks or conditional claims.",
    "medium: packages/backend/src/campaign/repositories/campaign.repository.ts:313-345 - fingerprint collision is warning-only and non-unique.",
    "medium: existing queue producers persist then enqueue without an outbox or stable jobId."
  ],
  "manualNotes": "Inspection-only task completed; required artifact written to the authoritative path."
}
```

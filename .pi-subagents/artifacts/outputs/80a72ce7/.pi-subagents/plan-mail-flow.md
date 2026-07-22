# Code Context

## Files Retrieved

1. `docs/architecture.md` (lines 1-180) - stack boundaries: Prisma, tRPC, BullMQ worker, and static Hono server.
2. `packages/database/prisma/schema.prisma` (lines 343-373, 499-545, 625-667) - email-template tracking flag, target-group recipient schema, and campaign schema.
3. `packages/backend/src/target-group/repositories/target-group.repository.ts` (lines 1-308) - recipient creation, normalization, deduplication, and retrieval.
4. `packages/backend/src/campaign/repositories/campaign.repository.ts` (lines 97-144, 481-667) - campaign lifecycle/resource validation and scheduled-run snapshot cloning.
5. `packages/backend/src/campaign/services/campaign.service.ts` (lines 1-16) - recipient email normalization only.
6. `packages/backend/src/mail-sending/providers/mail-provider.types.ts` (lines 1-60) - common provider input/result contract.
7. `packages/backend/src/mail-sending/services/mail-dispatcher.service.ts` (lines 1-89) - direct profile/provider dispatcher.
8. `packages/backend/src/mail-sending/providers/smtp/smtp.provider.ts` (lines 17-101) - SMTP mapping and provider result.
9. `packages/backend/src/mail-sending/providers/microsoft-graph/microsoft-graph.provider.ts` (lines 20-111, 165-230) - Graph send/result and custom-header mapping.
10. `packages/backend/src/mail-sending/providers/general-api/general-api.provider.ts` (lines 15-165) - generic API request/result mapping.
11. `packages/backend/src/mail-sending/mail-sending-service.provider.ts` (lines 1-101) - only SMTP, Graph, and General API providers are registered.
12. `apps/next-app/src/server/modules/mail-sending/mail-sending.router.ts` (lines 35-108) - tRPC exposes profile CRUD, connection check, test send, capabilities; no campaign delivery/tracking endpoints.
13. `apps/next-app/src/server/modules/campaign/campaign.router.ts` (lines 1-166) - campaign lifecycle endpoints but no send/enqueue endpoint.
14. `apps/worker/src/index.ts` (lines 1-77) - workers only process site import and target-group import jobs.
15. `apps/static-server/src/routes/pages.ts` (lines 1-12) - wildcard page route is an explicit 501 TODO, not a tracking endpoint.
16. `packages/backend/tests/mail-sending/{smtp/smtp-provider.test.ts,microsoft-graph/microsoft-graph-provider.test.ts,general-api/general-api-provider.test.ts}` (entire files) - current provider-only coverage.

## Key Code

### Current flow

- The only operational delivery path is `MailDispatcherService.dispatch(profileId, organizationId, SendMailInput)` → profile lookup/cache → `provider.send()` (`packages/backend/src/mail-sending/services/mail-dispatcher.service.ts:18-40`). There are no in-repository callers of `dispatch`; the sole exposed send endpoint is a profile `sendTest` mutation (`apps/next-app/src/server/modules/mail-sending/mail-sending.router.ts:84-92`).
- Campaign publish only changes state to `PUBLISHED`; it does not enqueue or send (`packages/backend/src/campaign/repositories/campaign.repository.ts:114-144`). Worker handlers contain no campaign-mail handler (`apps/worker/src/index.ts:13-25`).
- Scheduled occurrence materialization does snapshot campaign resources into `SHADOW` rows, including target-group users (and deduplicates normalized emails) (`packages/backend/src/campaign/repositories/campaign.repository.ts:549-667`). This is a campaign configuration/recipient snapshot, not a per-recipient delivery-result snapshot.

### Recipient model

`TargetGroupUser` stores mutable recipient identity fields (`email`, optional `normalizedEmail`, first/last name, position) and only enforces uniqueness _inside its target group_ (`packages/database/prisma/schema.prisma:527-544`). `TargetGroup` may be shadowed per campaign (`:499-524`). No model relates one recipient to one campaign delivery, tracking key, result, provider message ID, attempt, or event.

### Provider contract

`SendMailInput` accepts `to: string[]`, optional generic headers, and unused metadata; `SendMailResult` is a single aggregate provider result (`packages/backend/src/mail-sending/providers/mail-provider.types.ts:25-52`). It cannot represent recipient-level state/outcome. SMTP forwards headers and returns Nodemailer `messageId` (`smtp.provider.ts:65-89`); Graph converts arbitrary headers to internet message headers but returns no provider ID and incorrectly reports the sender mailbox as accepted (`microsoft-graph.provider.ts:95-100,190-216`). General API does not serialize `headers`, `metadata`, or `replyToEmail` into its request (`general-api.provider.ts:142-165`).

## Findings / Requested-need gap analysis

1. **BLOCKER — no durable per-recipient result snapshot exists.** `schema.prisma` has Campaign/TargetGroupUser but no delivery/recipient-result table, no campaign-recipient relation, no status/attempt timestamps/error/result/provider-message-ID fields, and no immutable rendered content/recipient snapshot (`packages/database/prisma/schema.prisma:499-545,625-667`). The scheduled shadow target group is insufficient: it stores recipients but not send outcome or one row per send. Add a Prisma migration/model and backend repository/service before wiring delivery.

2. **BLOCKER — there is no campaign-to-recipient mail sending pipeline.** Campaign actions change lifecycle state only, no route/command invokes `MailDispatcherService.dispatch`, and BullMQ has no delivery queue/handler (`packages/backend/src/campaign/repositories/campaign.repository.ts:114-144`; `apps/next-app/src/server/modules/campaign/campaign.router.ts:42-105`; `apps/worker/src/index.ts:13-25`). Consequently no recipient results, retries/idempotency, or result persistence can occur. Delivery should run one intended recipient per durable result row/job, rather than passing a target group as a multi-recipient `to` array.

3. **BLOCKER — unique recipient tracking keys are absent.** The only tracking-related persistence is `EmailTemplate.trackingPixel: Boolean` (`packages/database/prisma/schema.prisma:343-373`), and the historical migration only adds that flag (`packages/database/prisma/migrations/20260622180123_add_files_and_tracking_pixel/migration.sql:1-4`). No key/token field, uniqueness constraint, key generator, link/pixel HTML injection, or key lookup exists. A boolean cannot identify a recipient or safely correlate events.

4. **BLOCKER — event log and tracking ingestion routes are absent.** No event model, event repository, event command, event tRPC router, webhook route, open-pixel route, or click redirect route is present. The static page wildcard returns 501 (`apps/static-server/src/routes/pages.ts:5-9`) and cannot serve a landing/tracking URL. `PageSubmission` records page form data only and has no recipient/campaign key relation (`packages/database/prisma/schema.prisma:410-421`, inspected in full schema). Define append-only event records (event type/time, delivery-result foreign key, request/provider payload and dedupe key), plus authenticated provider webhooks and public key-bearing pixel/click/landing routes.

5. **HIGH — Message-ID uniqueness is not implemented or portable across providers.** The common input has only arbitrary headers (`mail-provider.types.ts:25-38`), but no generated logical message ID or required field. SMTP will pass a supplied `Message-ID` and otherwise Nodemailer generates one (`smtp.provider.ts:65-85`); Graph maps headers despite declaring `supportsCustomHeaders: false` (`microsoft-graph.provider.ts:20-30,190-216`); General API drops headers entirely (`general-api.provider.ts:142-165`). No code generates, validates, persists, or uniqueness-constrains a Message-ID per recipient/send attempt. Decide whether the persisted canonical ID is an RFC 5322 Message-ID, provider ID, or both; generate/persist it before dispatch, inject it only where supported, and record provider IDs separately.

6. **HIGH — existing dispatcher result semantics lose recipient attribution and include correctness defects.** `SendMailResult` is one aggregate response even when `to` contains many recipients (`mail-provider.types.ts:25-52`); provider accepted/rejected lists cannot be reliably joined to campaign recipients and no result is persisted (`mail-dispatcher.service.ts:18-40`). Profile-not-found fabricates its `provider` by casting `message`/`input` (`mail-dispatcher.service.ts:24-30,48-55`), so failure data is type-invalid. Graph reports `[senderMailbox]` as accepted rather than recipients (`microsoft-graph.provider.ts:95-100`). These must be corrected when defining per-recipient result state.

7. **MEDIUM — tests do not cover the requested contract.** Existing mail tests verify provider capability/config or Graph payload mapping (`packages/backend/tests/mail-sending/smtp/smtp-provider.test.ts:1-56`; `.../microsoft-graph/microsoft-graph-provider.test.ts:1-185`; `.../general-api/general-api-provider.test.ts:1-73`). There are no tests for campaign send enqueueing, recipient snapshot immutability, unique tracking key/Message-ID creation, event ingestion/deduplication, retry idempotency, or persistence of success/rejection/provider errors. Add unit tests around token/Message-ID generation and dispatcher persistence, plus Prisma integration tests for unique constraints and event/result relations.

## Architecture

Catalog resources (template/page/profile/group) are selected by a Campaign. Scheduled execution creates shadow copies of those resources, including target users, to make the campaign configuration stable. Separately, mail-sending profiles route a generic `SendMailInput` through a registry to SMTP, Graph, or General API. These subsystems currently never connect: campaign lifecycle and workers never invoke the dispatcher. The static server currently has no functional page lookup and no tracking handling. Therefore the requested design needs a new delivery domain connecting shadow campaign recipients to provider dispatch and tracking/event routes, not merely extending a provider.

## Start Here

Open `packages/database/prisma/schema.prisma` first. It must gain the durable delivery-result snapshot, unique tracking key, canonical/provider Message-ID fields, and append-only event-log relations/constraints before queue, dispatcher, or HTTP routes can reliably implement the flow.

## Supervisor coordination

No decision requested. Scope is inspect-only; no repository source files were edited.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Seven concrete gap findings include blocker/high/medium severity and exact source paths/line ranges for models, flow, providers, routes, workers, and tests."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "git status --short && git diff --cached --name-only && git diff --name-only",
      "result": "passed",
      "summary": "No tracked staged or unstaged source changes; only untracked .pi-subagents/ artifact workspace."
    },
    {
      "command": "targeted repository searches and numbered source inspection",
      "result": "passed",
      "summary": "Located all mail dispatcher callers, provider implementations, Prisma models/migrations, static routes, worker handlers, and mail tests."
    }
  ],
  "validationOutput": [
    "Inspection confirms no campaign delivery caller/queue handler, recipient result model, tracking/event model or route, or Message-ID generation/persistence.",
    "No test suite run because this was an inspect-only task with no code changes."
  ],
  "residualRisks": [
    "Provider webhook/event semantics and public tracking URL/domain requirements are not specified and need product/API decisions.",
    "General API providers cannot guarantee custom Message-ID propagation with the current fixed payload mapping.",
    "A non-atomic send/persist design could duplicate delivery or lose outcomes on worker retries; durable idempotency must be designed with the new result row."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository source diff (inspection only).",
  "reviewFindings": [
    "blocker: packages/database/prisma/schema.prisma:499-667 - no per-recipient result snapshot, tracking key, Message-ID persistence, or event-log model.",
    "blocker: apps/worker/src/index.ts:13-25 and packages/backend/src/campaign/repositories/campaign.repository.ts:114-144 - campaign lifecycle has no delivery enqueue/worker path.",
    "blocker: apps/static-server/src/routes/pages.ts:5-9 - public page route is 501 and no tracking/event routes exist.",
    "high: packages/backend/src/mail-sending/providers/mail-provider.types.ts:25-52 - aggregate multi-recipient provider contract cannot express per-recipient results.",
    "high: packages/backend/src/mail-sending/providers/general-api/general-api.provider.ts:142-165 - custom headers (including Message-ID) are discarded."
  ],
  "manualNotes": "Report written to the required artifact path; source repository was not edited."
}
```

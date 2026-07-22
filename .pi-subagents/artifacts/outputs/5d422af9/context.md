# Code Context

## Files Retrieved

1. `specs/003-campaigns-and-scheduling/spec.md` (lines 76-328, 335-344) — authoritative requirements for composition, schedules, lifecycle, snapshots, timezones, broken references, and current-baseline gap.
2. `packages/database/prisma/schema.prisma` (lines 11-62, 151-171, 250-299, 386-442) — existing enum/model, naming, organization FK, and index conventions.
3. `packages/database/prisma/schema.prisma` (lines 405-420) — current target recipient uniqueness is raw-email based, not canonical-email based.
4. `packages/database/prisma/migrations/20260702185023_add_mail_sending_profile/migration.sql` (lines 1-31) — migrations create PostgreSQL enums/tables/indexes/FKs explicitly; use a new migration rather than schema push.
5. `packages/backend/src/target-group/repositories/target-group.repository.ts` (lines 41-225) — target groups can be archived or physically deleted; imports use `skipDuplicates` against raw email.
6. `packages/backend/src/mail-sending/repositories/mail-sending-profile.repository.ts` (lines 58-147) — sending profiles are physically deletable and have no status/archive field.
7. `packages/shared/src/constants/permissions.ts` (lines 1-50) and `apps/next-app/src/server/auth/permissions.ts` (lines 10-44) — central permission-resource list plus explicit roles; both need `campaigns` wiring.
8. `apps/next-app/app/(app)/(org)/schedule/page.tsx` (lines 1-10) — schedule UI is currently a placeholder.

## Key Code

### Existing persistence conventions

- IDs are `String @id @default(cuid())`; tables use singular snake_case `@@map` names.
- Organization-owned models use required `organizationId`, FK `onDelete: Cascade`, and individual `@@index([organizationId])` (e.g. EmailTemplate/Page/TargetGroup/MailSendingProfile).
- Existing resource statuses are inconsistent: `EmailTemplateStatus` and `PageStatus` only have `DRAFT`/`ACTIVE`, while `TargetGroupStatus` also has `ARCHIVED`; sending profiles have no status.
- `TargetGroupUser` has `@@unique([targetGroupId, email])`, which cannot satisfy spec 003's trim+case-insensitive recipient identity (spec lines 321-328).

### Recommended Prisma design

Use normalized models for selection/configuration and **one immutable JSON snapshot per materialized occurrence**. This keeps private historical copies independent of mutable/cascading source rows without duplicating the public resource tables.

```prisma
enum CampaignKind { TEMPLATE CONCRETE }
enum CampaignStatus { DRAFT PUBLISHED SCHEDULED PENDING_START ACTIVE PAUSED COMPLETED FAILED }
enum ScheduleKind { ONE_TIME RECURRING }
enum ScheduleStatus { DRAFT SCHEDULED RUNNING COMPLETED CANCELLED BROKEN }
enum ScheduleSelectionStrategy { DECK RANDOM }
enum RecurrenceFrequency { WEEKLY MONTHLY QUARTERLY HALF_YEARLY YEARLY }
enum DeliveryMode { BLAST DRIP BATCH }

model Campaign {
  id String @id @default(cuid())
  organizationId String
  createdById String
  name String
  kind CampaignKind
  status CampaignStatus @default(DRAFT)
  emailTemplateId String
  pageId String
  mailSendingProfileId String
  targetGroupId String? // required by service/DB check iff CONCRETE
  targetTimezone String // IANA, copied from org default on creation
  launchConfig Json? // APPROVAL REQUIRED: schema not specified by 003
  sourceCampaignId String? // clone provenance only, never mutation
  scheduleId String? // populated only for materialized child occurrence
  occurrenceAt DateTime? @db.Timestamptz(3)
  autoCompleteAfterDays Int? @default(20)
  snapshot CampaignSnapshot?
  ...
  @@index([organizationId, kind, status])
  @@index([scheduleId, status])
  @@index([organizationId, occurrenceAt])
}

model Schedule {
  id String @id @default(cuid())
  organizationId String
  createdById String
  kind ScheduleKind
  status ScheduleStatus @default(DRAFT)
  targetGroupId String
  targetTimezone String
  sourceCampaignId String? // concrete source: one-time direct flow only
  startsAt DateTime? @db.Timestamptz(3) // resolved UTC first/one-time instant
  recurrence Json? // typed calendar rule, persisted with targetTimezone
  selectionStrategy ScheduleSelectionStrategy?
  shuffleDeck Boolean @default(false)
  deliveryMode DeliveryMode
  dripEmailsPerMinute Int?
  batchSize Int?
  batchIntervalMinutes Int?
  maxCampaigns Int?
  endsAt DateTime? @db.Timestamptz(3)
  autoCompleteAfterDays Int? @default(20)
  cancelledAt DateTime?
  completedAt DateTime?
  sources ScheduleSource[]
  campaigns Campaign[]
  ...
  @@index([organizationId, status, startsAt])
  @@index([targetGroupId])
  @@index([sourceCampaignId])
}

model ScheduleSource {
  scheduleId String
  campaignId String // must reference TEMPLATE for schedule-area sources
  position Int? // durable deck order; nullable for Random
  schedule Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Restrict)
  @@id([scheduleId, campaignId])
  @@unique([scheduleId, position])
  @@index([campaignId])
}

model CampaignSnapshot {
  id String @id @default(cuid())
  campaignId String @unique
  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  sourceState Json // campaign configuration plus email/page/profile/group data
  recipients CampaignSnapshotRecipient[]
  createdAt DateTime @default(now())
  @@map("campaign_snapshot")
}
model CampaignSnapshotRecipient {
  id String @id @default(cuid())
  snapshotId String
  normalizedEmail String
  email String
  firstName String
  lastName String
  position String?
  snapshot CampaignSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  @@unique([snapshotId, normalizedEmail])
  @@index([snapshotId])
  @@map("campaign_snapshot_recipient")
}
```

Add `Organization.defaultTimezone String @default("UTC")`. Store instants as `@db.Timestamptz(3)` (the schema already uses this PostgreSQL type in `Apikey`); retain IANA IDs and recurrence/calendar data, rather than serializing local dates as UTC strings.

### Constraints and indexes that matter

- **Cross-organization asset integrity is not expressible by ordinary single-column Prisma FKs.** Validate all campaign/schedule resource IDs are owned by the same organization in one transaction; alternatively add composite `@@unique([id, organizationId])` to every asset and composite FKs in SQL. This is security-critical.
- Add SQL `CHECK` constraints in the migration (Prisma cannot model them): template => `targetGroupId IS NULL`; concrete => `targetGroupId IS NOT NULL`; schedule-kind/source cardinalities; one-time has exactly one source; delivery-mode-specific values are positive and other mode columns null; nonnegative `maxCampaigns`/completion duration; recurrence fields valid for selected frequency.
- Model impossible lifecycle transitions in service transactions, not enum alone. Cancellation must atomically stop schedule and complete child campaigns in the specified nonterminal states.
- Use `onDelete: Restrict` for mutable source dependencies (`Campaign` assets and `ScheduleSource`) to preserve broken records and enable repair. Do **not** cascade-delete schedules/campaigns when page/template/profile/group is deleted. Snapshots may cascade only with their owning occurrence.
- `ScheduleSource.position` is required for Deck and makes shuffled order durable/reproducible; retain selection history (or derive from child campaigns ordered by occurrence) to enforce deck exhaustion and Random no-consecutive-repeat.
- Required lookup indexes: `Campaign(organizationId, kind, status)`, `Campaign(scheduleId, status)`, `Campaign(organizationId, occurrenceAt)`, `Schedule(organizationId, status, startsAt)`, `ScheduleSource(campaignId)`, and unique `(snapshotId, normalizedEmail)`.
- Do **not** add a unique collision index: spec explicitly permits duplicates; query an indexable fingerprint/equivalent fields to issue a warning only.

## Architecture

Public source resources remain organization-scoped `EmailTemplate`, `Page`, `MailSendingProfile`, and `TargetGroup`. A campaign references exactly one of each (target optional only for a template). A schedule references source campaigns via a join model and one target group. Occurrence creation clones source state to a concrete campaign, then creates the campaign-owned snapshot and canonical recipient rows transactionally. After that, execution/history reads only snapshot rows/JSON, so source edits/archival/deletion cannot affect it.

The direct-concrete one-time flow and Schedule-area template flows are deliberately represented separately: `Schedule.sourceCampaignId` represents the direct concrete source; `ScheduleSource` represents template deck/random sources. Enforce the allowed combinations in database SQL checks plus services.

## Findings / approval-required ambiguities

- **Blocker — `specs/003-campaigns-and-scheduling/spec.md:76-85`:** “campaign URL and other campaign-level settings” are referenced but no fields/value semantics are defined. Approve concrete fields (at minimum phishing/landing URL) before a non-JSON campaign schema can be finalized.
- **High — `specs/003-campaigns-and-scheduling/spec.md:292-307` vs `packages/database/prisma/schema.prisma:250-299,423-442`:** spec relies on archived/ineligible dependencies, but pages/templates lack `ARCHIVED` and sending profiles lack any status; current repositories physically delete groups/profiles. Approve whether to add `ARCHIVED` to all applicable public resources versus retain deletion with `Restrict` and broken-reference state.
- **High — `packages/database/prisma/schema.prisma:405-420`; `packages/backend/src/target-group/repositories/target-group.repository.ts:159-225`:** stored/uniquely constrained email is not normalized, so import and snapshot source data may contain logical duplicates. Approve canonicalization policy/storage migration (recommended `normalizedEmail = lower(trim(email))`, backfill and unique `(targetGroupId, normalizedEmail)`) and how to resolve existing collisions.
- **Medium — `specs/003-campaigns-and-scheduling/spec.md:208-227`:** target timezone is required but no validation authority/library or organization-default migration/backfill policy is stated. Recommended: non-null default `UTC`, validate IANA names in application, persist resolved UTC with `Timestamptz`.
- **Medium — `specs/003-campaigns-and-scheduling/spec.md:173-180`:** “equivalent scheduling properties” for duplicate warnings has no canonical equality definition, especially for semantically equivalent recurrence JSON/timezones. Approve a normalized collision fingerprint definition; it must not be unique.
- **Medium — snapshots:** 003 requires complete private shadow copies but does not require them to be relational/queryable. The proposed hybrid JSON + normalized recipients is recommended; approve if audit/reporting needs individual snapshot asset tables instead.

## Start Here

Open `packages/database/prisma/schema.prisma`: it defines all current FK/index/naming conventions and is the required starting point for the new migration. Then resolve the six approvals above before writing the migration, because they determine FK deletion behavior, constraints, and snapshot shape.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete schema recommendation, source file/line references, and severity-labelled findings are included."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "git status --short; git log -1 --oneline",
      "result": "passed",
      "summary": "No repository implementation files changed; untracked .pi-subagents runtime directory exists."
    }
  ],
  "validationOutput": [
    "Inspection only; no Prisma schema, migration, or application files were edited.",
    "Current schema and relevant repository/permission implementations were reviewed."
  ],
  "residualRisks": [
    "Campaign URL/settings, archival/deletion policy, canonical email migration, timezone validation, collision equivalence, and snapshot normalization require approval before implementation.",
    "Normal Prisma foreign keys alone cannot guarantee all selected assets belong to the campaign organization."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository code changes; scouting findings written only to the required runtime artifact.",
  "reviewFindings": [
    "blocker: specs/003-campaigns-and-scheduling/spec.md:76-85 - campaign URL and other campaign-level settings have no concrete persistence contract.",
    "high: packages/database/prisma/schema.prisma:250-299,423-442 - archive/ineligibility behavior required by spec is not uniformly represented by current resource models.",
    "high: packages/database/prisma/schema.prisma:405-420 - raw-email uniqueness does not meet normalized recipient uniqueness.",
    "medium: spec 003 collision equality and snapshot storage shape need product approval."
  ],
  "manualNotes": "Do not model schedule collision detection as a uniqueness constraint: the product explicitly allows saving duplicates after warning."
}
```

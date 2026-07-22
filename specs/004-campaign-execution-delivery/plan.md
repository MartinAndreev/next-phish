# Implementation Plan

## Architecture

Implement a database-led pipeline with five worker responsibilities:

```text
schedule poller
  -> schedule occurrence + outbox
  -> materialization worker
  -> recipient results + delivery schedule + outbox
  -> delivery feeder
  -> one-recipient mail workers
  -> campaign events / delivery events
```

BullMQ provides retries, concurrency, delayed wake-ups, and horizontal worker scaling. PostgreSQL uniqueness constraints, compare-and-set transitions, leases, and the outbox provide correctness.

## Repository boundaries

| Area                                   | Intended responsibility                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `packages/database/prisma/`            | Occurrence, recipient result, outbox, attempts, campaign events, delivery events, ignored networks, constraints, and indexes. |
| `packages/backend/src/campaign/`       | Existing campaign lifecycle integration and immutable shared snapshot orchestration.                                          |
| `packages/backend/src/scheduling/`     | Recurrence calculation, due claims, source selection, catch-up, schedule revisions, and occurrence state.                     |
| `packages/backend/src/delivery/`       | Recipient materialization, pacing, leases, rendering, provider dispatch, retries, events, and reconciliation.                 |
| `packages/backend/src/campaign-event/` | Public behavior-event validation, aggregate projection, ignored-network enforcement, and reporting queries.                   |
| `packages/backend/src/outbox/`         | Transactional records, claims, publication acknowledgement, and cleanup.                                                      |
| `packages/backend/src/mail-sending/`   | Provider capabilities, stable Message-ID propagation, provider idempotency, pooled SMTP, and error classification.            |
| `packages/shared/src/`                 | Versioned queue payload schemas and shared enums without secrets or PII.                                                      |
| `apps/worker/src/`                     | Queue bootstrap, handlers, concurrency/rate configuration, graceful shutdown, and metrics.                                    |
| `apps/static-server/src/routes/`       | Neutral pixel, link, landing, submission, and report routes.                                                                  |
| `apps/next-app/src/server/`            | Administrative tRPC endpoints, queue/outbox visibility, result/event queries, ignored-network management.                     |

## Data design

### New models

1. `ScheduleOccurrence`
   - Unique `(scheduleId, occurrenceAt)`.
   - Persists source selection, schedule revision, campaign link, lifecycle, cursor, lease, attempts, and errors.
2. `CampaignRecipient`
   - Unique `(campaignId, normalizedEmail)`.
   - Unique `trackingRef`, `idempotencyKey`, and `messageId`.
   - Stores immutable recipient data, deterministic send time, delivery aggregate, negative-event aggregate, report aggregate, lease, and retries.
3. `DeliveryAttempt`
   - Unique `(campaignRecipientId, attemptNumber)`.
   - Records sanitized invocation outcome and provider correlation.
4. `CampaignEvent`
   - High-level enum constrained to the seven approved values.
   - Required unique deduplication key.
5. `DeliveryEvent`
   - Technical transport event and transition metadata.
   - Required unique deduplication key and optional provider event identity.
6. `OutboxEvent`
   - Unique deduplication key, availability, claim, publish state, attempts, and minimal versioned payload.
7. `OrganizationIgnoredNetwork`
   - Unique normalized network per organization with description and creator attribution.

### Existing model changes

- Add schedule revision and claim-friendly indexes.
- Link campaign to its occurrence where the existing schedule/instant relation is insufficient.
- Add organization relations for ignored networks and result/event query indexes.
- Preserve existing hidden campaign resource snapshots while moving per-recipient execution state into `CampaignRecipient`.

## Delivery state design

Use an explicit transition service rather than ordering status strings.

Suggested recipient delivery states:

```text
PLANNED -> QUEUED -> DISPATCHING -> SENT
PLANNED|QUEUED -> CANCELLED
DISPATCHING -> RETRYABLE | FAILED | DELIVERY_UNKNOWN
RETRYABLE -> QUEUED
```

- `SENT`, `FAILED`, `DELIVERY_UNKNOWN`, and `CANCELLED` are terminal for automatic processing.
- Reconciliation may resolve `DELIVERY_UNKNOWN` through an explicit audited transition.
- Campaign event `SENT` is emitted on provider/SMTP acceptance.
- Campaign event `FAILED` is emitted on permanent failure or exhausted safe retries.

## Idempotency boundaries

| Operation                   | Idempotency mechanism                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| Claim schedule occurrence   | Unique `(scheduleId, occurrenceAt)` plus locked schedule advancement.  |
| Choose source               | Persist once on occurrence.                                            |
| Create campaign             | Unique occurrence-to-campaign relation and occurrence compare-and-set. |
| Snapshot recipient          | Unique `(campaignId, normalizedEmail)`.                                |
| Generate tracking reference | Unique constraint plus secure regeneration on collision.               |
| Generate Message-ID         | Unique persisted value created before first attempt.                   |
| Publish queue work          | Unique outbox dedupe key plus stable BullMQ job ID.                    |
| Claim recipient send        | Conditional status update plus expiry lease.                           |
| Record attempt              | Unique recipient/attempt number.                                       |
| Record event                | Required unique dedupe key.                                            |
| Apply recipient aggregate   | Same transaction as first event insertion.                             |
| Process provider webhook    | Unique provider event identity/dedupe key.                             |

## Execution stages

### Stage 1 — Foundations

- Add schema, migrations, constraints, indexes, enums, and TypeDI providers.
- Add versioned queue payload schemas containing IDs only.
- Add neutral identifier generators and tests.
- Add trusted-proxy and public-host deployment configuration.

### Stage 2 — Recurrence and occurrence claims

- Extract recurrence calculation into a pure service.
- Add DST, missing-month-day, end-condition, Deck, Random, and bounded catch-up tests.
- Add concurrent claim repository code using locked batches.
- Advance schedule and insert occurrence/outbox atomically.
- Convert uniqueness conflicts to existing-occurrence success.

### Stage 3 — Resumable materialization

- Refactor current one-transaction materialization into occurrence phases.
- Snapshot campaign-level resources once.
- Iterate target users with keyset pagination.
- Deduplicate by normalized email at the database boundary.
- Generate recipient `trackingRef`, Message-ID, idempotency key, and `scheduledAt` deterministically where required.
- Persist cursor/counts and finalize only after validation.

### Stage 4 — Outbox and BullMQ topology

- Add outbox claim/publish/acknowledge worker.
- Add dedicated queues and strict unknown-job failures.
- Configure attempts, backoff, retention, graceful shutdown, metrics, and dead-letter visibility.
- Ensure worker container receives Redis so mail services are registered.

### Stage 5 — Delivery feeder and worker

- Claim only recipients inside a configurable rolling horizon.
- Apply tenant fairness and profile/provider limits.
- Render one immutable recipient message per job.
- Recheck campaign state immediately before send.
- Persist attempt and delivery events around dispatch.
- Classify safe retry, permanent failure, and ambiguous outcome.

### Stage 6 — Provider hardening

- Extend the common contract with stable logical Message-ID and optional idempotency key.
- Preserve one-recipient semantics.
- Make provider capabilities truthful and tested.
- Correct accepted-recipient attribution.
- Forward approved headers/metadata where supported.
- Add pooled SMTP and CR/LF header protection.
- Preserve requested and provider-assigned message identifiers separately.

### Stage 7 — Tracking and events

- Add neutral pixel, click, landing, submission, and report routes.
- Resolve short `ref` values without leaking record validity.
- Map click link IDs to immutable approved destinations.
- Implement trusted client-IP resolution and ignored CIDR filtering before event creation.
- Insert campaign events and update aggregates transactionally.
- Keep technical delivery events in their own module/table.

### Stage 8 — Operations and rollout

- Add dashboards, queue/outbox reconciliation, expired-lease recovery, and kill switches.
- Add retention/cleanup for events, attempts, completed queue jobs, and sensitive submissions.
- Run integration, concurrency, load, and chaos suites.
- Roll out behind organization feature flags with low initial recipient and throughput limits.

## Migration and compatibility

- Existing schedules remain persisted; enabling execution requires an explicit migration/activation decision so old due schedules do not unexpectedly send.
- The default migration policy marks pre-feature schedules as execution-disabled until an authorized member reviews and enables them.
- Existing campaign snapshots remain readable.
- Existing provider test-send behavior continues but uses the hardened provider contract.
- No public tracking route is enabled before trusted-proxy, neutral host, and reference-redaction configuration pass startup validation.

## Security controls

- Reject startup when public tracking hostname or Message-ID domain contains blocked platform/simulation markers.
- Redact `ref` query values at edge proxy and application logging layers.
- Validate organization network entries and audit changes.
- Verify provider webhook signatures and replay windows.
- Encrypt approved captured values and provider configuration.
- Restrict operational metadata and event access by organization permission.
- Apply public endpoint rate limits without changing valid/invalid response shape.

## Verification gates

1. Schema concurrency tests pass before queue integration.
2. Recurrence/DST tests pass before schedule polling is enabled.
3. Duplicate-job and crash-point integration tests pass before provider dispatch is enabled.
4. Ambiguous SMTP acceptance test produces `DELIVERY_UNKNOWN`, not resend.
5. Ignored-network and proxy-spoof tests pass before public tracking routes are enabled.
6. Neutral-artifact inspection passes against raw email, headers, HTML, URLs, DNS names, HTTP responses, and logs.
7. Load targets pass with bounded PostgreSQL transactions, Redis memory, queue lag, and provider concurrency.

## Principal risks and controls

| Risk                                                   | Control                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| External send succeeds before database acknowledgement | Provider idempotency or `DELIVERY_UNKNOWN`; controlled durable relay for stronger guarantees.                |
| Duplicate occurrence under concurrent pollers          | Unique occurrence key and locked atomic advancement.                                                         |
| Large group causes transaction/Redis exhaustion        | Resumable keyset materialization and rolling delivery horizon.                                               |
| Cancellation races an in-flight send                   | Leases and immediate pre-dispatch state recheck; document that accepted mail cannot be recalled.             |
| Scanner creates false activity                         | Organization ignored networks plus separate automated-traffic classification.                                |
| Spoofed forwarding header bypasses tracking            | Trust forwarded headers only from configured proxies.                                                        |
| Short reference is enumerated                          | Approximately 70-bit random value, rate limits, neutral responses, uniqueness constraint, and log redaction. |
| Public artifact reveals simulation                     | Neutral naming gate and raw-message/HTTP artifact tests.                                                     |

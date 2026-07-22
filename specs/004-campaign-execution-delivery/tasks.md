# Tasks

## Decisions and schema

- [ ] T001 — Record ADRs for effectively-once delivery, ambiguous-send handling, bounded schedule catch-up, and controlled-relay deployment.
- [ ] T002 — Add schedule-occurrence, campaign-recipient, delivery-attempt, campaign-event, delivery-event, outbox, and ignored-network models with constraints and indexes.
- [ ] T003 — Add migration policy that leaves pre-feature schedules execution-disabled until reviewed.
- [ ] T004 — Add versioned ID-only queue payload schemas and neutral identifier generators.
- [ ] T005 — Add recipient delivery transition, campaign event, delivery event, and negative-severity enums.

## Recurrence and schedule execution

- [ ] T006 — Implement pure recurrence calculation using Feature 003 timezone, DST, missing-day, and end-condition rules.
- [ ] T007 — Implement deterministic persisted Deck/Random source selection.
- [ ] T008 — Implement bounded catch-up and schedule revision behavior.
- [ ] T009 — Implement concurrent due-schedule claiming with atomic occurrence creation, schedule advancement, and outbox insertion.
- [ ] T010 — Make cancellation and edits race-safe with occurrence claims and revisions.

## Campaign and recipient materialization

- [ ] T011 — Refactor occurrence materialization into a leased, resumable state machine.
- [ ] T012 — Snapshot campaign-level resources once per occurrence campaign.
- [ ] T013 — Materialize normalized recipient snapshots through keyset-paginated batches.
- [ ] T014 — Generate unique 12-character tracking references, stable Message-IDs, and delivery idempotency keys.
- [ ] T015 — Calculate deterministic Blast, Drip, and Batch `scheduledAt` values.
- [ ] T016 — Finalize materialization only after count/integrity verification and emit idempotent `SCHEDULED` campaign events.

## Outbox and queues

- [ ] T017 — Implement transactional outbox claim, publication, acknowledgement, retry, and cleanup.
- [ ] T018 — Add dedicated schedule, materialization, feeder, delivery, and webhook/event queues.
- [ ] T019 — Make unknown job types fail and add graceful shutdown/lease recovery.
- [ ] T020 — Pass Redis into worker container initialization and register required delivery services.
- [ ] T021 — Configure stable hashed BullMQ job IDs, bounded retention, attempts, and jittered backoff.

## Delivery

- [ ] T022 — Implement the rolling-horizon delivery feeder with bounded batches and tenant fairness.
- [ ] T023 — Implement one-recipient delivery claims, leases, terminal no-ops, and campaign state rechecks.
- [ ] T024 — Implement immutable rendering and neutral pixel/link injection.
- [ ] T025 — Persist delivery attempts and technical delivery events around every provider invocation.
- [ ] T026 — Classify safe transient, permanent, throttled, and ambiguous provider outcomes.
- [ ] T027 — Emit `SENT` only on provider/SMTP acceptance and `FAILED` only on permanent failure or exhausted safe retries.
- [ ] T028 — Implement reconciliation for expired leases and `DELIVERY_UNKNOWN` without automatic ambiguous resend.

## Provider hardening

- [ ] T029 — Extend provider input with stable logical Message-ID and optional provider idempotency key.
- [ ] T030 — Enforce one recipient per campaign provider request.
- [ ] T031 — Preserve requested and provider-assigned identifiers separately.
- [ ] T032 — Correct provider capability and accepted-recipient behavior and forward approved metadata/headers.
- [ ] T033 — Add pooled SMTP, header-injection protection, bounded timeouts, and provider-specific rate classification.

## Tracking and events

- [ ] T034 — Implement neutral open-pixel handling through `?ref=`.
- [ ] T035 — Implement neutral click handling using `?ref=` plus immutable server-side link IDs.
- [ ] T036 — Implement landing-page and submission association through `?ref=`.
- [ ] T037 — Implement report association and independent reported aggregate.
- [ ] T038 — Implement campaign event deduplication and atomic monotonic result projections.
- [ ] T039 — Keep campaign event and delivery event repositories, services, permissions, and retention separate.
- [ ] T040 — Add provider webhook signature, timestamp, replay, and delivery-event handling.

## Ignored networks and client IP

- [ ] T041 — Add organization-admin CRUD for exact IPv4/IPv6 and CIDR ignored networks with audit history.
- [ ] T042 — Implement trusted-proxy-aware client-IP resolution and normalization.
- [ ] T043 — Apply ignored-network checks before open, click, and submission event insertion.
- [ ] T044 — Add cache invalidation and privacy-safe ignored-event metrics.

## Security, operations, and rollout

- [ ] T045 — Add log/telemetry redaction for references, recipient PII, provider secrets, rendered content, and submission values.
- [ ] T046 — Add organization, campaign, profile, and global delivery kill switches.
- [ ] T047 — Add global/provider/profile rate limits, tenant quotas, circuit breaking, and backpressure.
- [ ] T048 — Add dashboards and alerts for schedule lag, outbox lag, delivery failures, unknown outcomes, invalid references, and ignored events.
- [ ] T049 — Add captured-data encryption, field allowlisting, access auditing, and retention cleanup.
- [ ] T050 — Add startup validation and artifact tests preventing externally visible platform or simulation markers.
- [ ] T051 — Run concurrency, provider, load, and chaos suites and record capacity limits.
- [ ] T052 — Roll out behind organization feature flags with conservative initial quotas.

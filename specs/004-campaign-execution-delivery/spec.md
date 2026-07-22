# Feature 004 — Campaign Execution, Delivery, and Tracking

> **Status:** Proposed implementation contract.

## Problem, user, and outcome

**Problem:** Schedule configuration and occurrence materialization exist, but no production worker advances schedules or sends campaign email. The system also lacks durable recipient results, tracking references, event history, retry-safe publication, and provider-aware delivery controls.

**User:** Organization members operating authorized security-awareness simulations.

**Outcome:** Due schedules create exactly one occurrence and one immutable campaign result set; eligible recipient messages are paced and processed safely under load; retries do not duplicate durable work; recipient activity is attributed through short neutral references; and delivery uncertainty is explicit.

## Scope

In scope:

- Executing one-time and recurring schedules through workers.
- Deterministic recurrence, source selection, catch-up, and schedule completion.
- Idempotent occurrence and campaign materialization.
- Immutable per-recipient result snapshots.
- Blast, Drip, and Batch send-time calculation.
- Transactional outbox publication to BullMQ.
- Bounded concurrency, backpressure, rate limiting, retries, and cancellation.
- Stable RFC 5322 Message-ID generation and provider correlation.
- Separate high-level campaign events and technical delivery events.
- Short `?ref=` tracking references for opens, clicks, submissions, and reports.
- Organization-managed ignored IP addresses and CIDR ranges.
- Neutral externally visible URLs, headers, responses, and identifiers.
- Monitoring, reconciliation, retention controls, and load/chaos tests.

Out of scope:

- Claiming mathematically exact-once delivery across PostgreSQL and arbitrary SMTP servers.
- Treating Message-ID as an SMTP deduplication guarantee.
- Storing submitted passwords by default.
- Arbitrary redirect URLs supplied by a tracking request.
- Making Redis or BullMQ the authoritative delivery ledger.

## Core principles

1. PostgreSQL is the source of truth; BullMQ transports work.
2. Every asynchronous operation has a database uniqueness constraint or conditional state transition.
3. Queue jobs contain opaque identifiers only, never provider secrets, rendered messages, or recipient PII.
4. Worker handlers are safe to execute repeatedly and concurrently.
5. External delivery is "effectively once" where the provider supports idempotency; ambiguous non-idempotent submissions become `DELIVERY_UNKNOWN` rather than being automatically resent.
6. Campaign-level history and transport-level telemetry remain separate.
7. Nothing externally visible identifies the platform or reveals the simulation purpose.

## Terminology

| Term                      | Meaning                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Schedule occurrence       | Durable claim for one schedule at one resolved UTC instant.                                                       |
| Campaign recipient result | Immutable recipient snapshot plus current campaign and delivery aggregates.                                       |
| Campaign event            | High-level result timeline event: `SCHEDULED`, `SENT`, `OPENED`, `CLICKED`, `SUBMITTED`, `REPORTED`, or `FAILED`. |
| Delivery event            | Detailed provider/SMTP processing event used for operations and reconciliation.                                   |
| Delivery attempt          | One invocation of an external provider for one recipient result.                                                  |
| Tracking reference        | Short cryptographically random value carried as `?ref=` and stored uniquely on the recipient result.              |
| Outbox record             | Database record that atomically commits intent to publish asynchronous work.                                      |
| Delivery unknown          | Provider submission may have succeeded, but no safe confirmation exists.                                          |

## Schedule execution

### Polling and claiming

- A repeatable BullMQ scheduler wakes a schedule poller every 5–15 seconds.
- The poller selects due schedules in bounded batches using PostgreSQL row locking with `FOR UPDATE SKIP LOCKED` or an equivalent compare-and-set claim.
- In one transaction it creates the schedule occurrence, persists the selected source campaign, advances `nextOccurrenceAt`, updates schedule completion when required, and inserts an outbox record.
- `(scheduleId, occurrenceAt)` is unique. A uniqueness conflict is treated as an idempotent success by loading the existing occurrence.
- The selected source is persisted before materialization. Random and Deck selection are never recalculated during a retry.

### Recurrence and timezones

- Recurrence uses the calendar and timezone rules approved in Feature 003.
- Resolved instants are stored in UTC.
- Daylight-saving disambiguation remains compatible: spring gaps move forward by the gap and fall overlaps choose the earlier instant once.
- `endsAt`, `maxCampaigns`, Deck exhaustion, cancellation, and broken dependencies prevent further occurrences.
- The scheduler processes only a bounded number of missed occurrences after downtime. The default catch-up policy is to materialize the latest due occurrence and skip older missed occurrences; deployments may choose a bounded catch-up count but never an unlimited backlog.

### Lifecycle and races

- Schedule edits increment a revision. Every occurrence records the revision it uses.
- Cancellation prevents new claims and marks safe, unsent recipient work cancelled.
- A worker rechecks schedule/campaign state after acquiring a lease and immediately before an external send.
- Already accepted messages cannot be recalled.

## Idempotent materialization

- Materialization is claimed through the occurrence state, not by relying on a queue job lock.
- Shared campaign resources are snapshotted once and linked to the occurrence campaign.
- Large target groups are copied in resumable keyset-paginated chunks rather than one unbounded transaction.
- Recipient results are inserted with unique `(campaignId, normalizedEmail)` and a resumable cursor.
- A campaign is not send-eligible until the expected recipient count and materialization completion state are committed.
- A duplicate job returns the existing completed state or resumes the incomplete cursor.
- Concurrent unique-key conflicts are recovered as idempotent success, not exposed as terminal worker failure.

## Campaign recipient result

Each result stores:

- Campaign, organization, and optional source-user attribution.
- Immutable email, normalized email, first name, last name, position, and approved custom merge-data snapshot.
- Unique short `trackingRef`.
- Deterministic `scheduledAt`.
- Delivery status and timestamps.
- Stable logical Message-ID and separate provider message ID.
- Attempt count, retry time, lease, and sanitized last error.
- `highestNegativeEvent`, `highestNegativeEventAt`, `reported`, and `reportedAt`.

Recipient results are unique by `(campaignId, normalizedEmail)`. Shared template/page/profile snapshots remain campaign-level; their full contents are not duplicated into every result.

### Highest negative event

Severity is monotonic:

```text
NONE < OPENED < CLICKED < SUBMITTED
```

- `SCHEDULED`, `SENT`, `FAILED`, and `REPORTED` do not participate in severity.
- A late open cannot downgrade a click or submission.
- `highestNegativeEventAt` records the first accepted event that raised the highest severity.
- `reported` is orthogonal and preserves the first `reportedAt`.

## Email pacing

Recipient ordering is stable and deterministic.

- **Blast:** all results use the occurrence start as `scheduledAt`.
- **Drip:** stable result order is distributed at the configured emails-per-minute rate.
- **Batch:** stable result order is divided into `batchSize` groups separated by `batchIntervalMinutes`.

PostgreSQL stores all send times. A delivery feeder publishes only a bounded near-term horizon rather than creating an unbounded number of long-lived delayed Redis jobs.

## Queue and outbox behavior

Separate queues are used for schedule polling, materialization, delivery feeding, email delivery, and asynchronous delivery/webhook processing.

- Database state changes and outbox intent commit in one transaction.
- An outbox publisher claims rows in batches and uses a stable hashed BullMQ `jobId`.
- Republish after a crash is safe.
- BullMQ deduplication is an optimization; database state remains authoritative after completed jobs are removed.
- Unknown job types fail explicitly and are not acknowledged as successful.
- Workers use bounded concurrency and graceful shutdown so active jobs can finish or lose their lease safely.

## Delivery processing

One queue job handles one campaign recipient result.

1. Load by opaque ID and verify organization/campaign state.
2. Atomically claim an eligible result with a renewable expiry lease.
3. No-op when the result is terminal or already sent.
4. Render from immutable campaign and recipient snapshots.
5. Apply neutral tracking links and optional pixel.
6. Persist an attempt and `DISPATCH_STARTED` delivery event.
7. Submit to the provider.
8. Persist the result and append idempotent events.

Transient failures use bounded exponential backoff with jitter. Permanent provider/configuration failures do not retry. Campaign pause/cancellation prevents unclaimed work from sending.

### External side-effect boundary

- Provider idempotency keys are used when supported and remain stable across retries.
- For SMTP or a provider without idempotency, a confirmed pre-submission failure may retry.
- If acceptance may have occurred but confirmation was lost, the result becomes `DELIVERY_UNKNOWN` and requires reconciliation; it is not automatically resent under the no-duplicates policy.
- A controlled durable outbound relay with a unique delivery key is the recommended option when stronger submission guarantees are required.

## Message-ID

- Generate one stable RFC 5322 Message-ID before the first attempt.
- Reuse it for retries of the same logical message.
- Use an opaque value and a customer-controlled neutral domain.
- Do not embed campaign, organization, email, tracking reference, platform name, or simulation terminology.
- Store the logical Message-ID uniquely and store the provider-assigned identifier separately.
- Providers that replace the requested Message-ID must record both values.
- Message-ID enables correlation; it does not guarantee downstream deduplication.
- Custom headers are avoided unless necessary. Header names and values reject CR/LF injection.

## Tracking reference and public routes

- Each result receives a cryptographically random 12-character Base58 or Base62 `trackingRef`, giving approximately 70 bits of entropy while remaining unobtrusive.
- `trackingRef` has a database unique constraint and generation retries on collision.
- It is never derived from internal IDs or recipient data and is never written to ordinary logs, metrics, or error reports.
- Public links use a neutral `?ref=<value>` parameter.
- Click links additionally carry a short server-side link identifier; requests cannot provide an arbitrary redirect target.
- Pixels, landing pages, links, form responses, headers, HTML comments, asset names, hostnames, and Message-IDs contain no platform or simulation-identifying terms.
- Invalid, expired, cancelled, and ignored references return neutral behavior without revealing which condition occurred.

## Campaign events

The only campaign event types are:

```text
SCHEDULED
SENT
OPENED
CLICKED
SUBMITTED
REPORTED
FAILED
```

- `SCHEDULED` is created when a recipient result and send time become final.
- `SENT` is created when the provider or SMTP server accepts the message.
- `FAILED` is created only for permanent failure or exhausted safe retries, not temporary deferral.
- `OPENED`, `CLICKED`, and `SUBMITTED` come from accepted public tracking requests.
- `REPORTED` records recipient reporting independently of negative severity.
- Events are append-only and idempotent by required deduplication key.
- Event insertion and recipient aggregate update occur in one transaction.

## Delivery events

Delivery events form a separate technical stream. Types may include:

```text
QUEUED
DISPATCH_STARTED
ACCEPTED
DEFERRED
DELIVERED
BOUNCED
REJECTED
RETRY_SCHEDULED
DELIVERY_UNKNOWN
CANCELLED
```

- Delivery events update delivery status through an explicit transition table.
- They never update `highestNegativeEvent` or `reported` directly.
- Provider webhook identities and internal attempt identities supply deduplication keys.
- Sanitized metadata may include enhanced SMTP status and provider response codes, but never secrets or full SMTP sessions.

## Ignored organization networks

- Organization administrators can maintain exact IPv4/IPv6 addresses and CIDR ranges with a description.
- Values are validated, normalized, unique per organization, audited, and cache-invalidation aware.
- `OPENED`, `CLICKED`, and `SUBMITTED` requests from a matching network are served normally but create no campaign event and do not update the result aggregate.
- `REPORTED` and delivery events are not ignored by this setting.
- Ignored activity may increment a privacy-safe organization/event-type operational counter but is not stored as recipient event history.

### Client IP trust

- The direct peer address is authoritative by default.
- Forwarded headers are trusted only when the direct peer is a deployment-configured trusted reverse proxy.
- Proxy trust configuration is separate from organization ignored networks.
- IPv4, IPv6, IPv4-mapped IPv6, ports, and CIDR membership are normalized consistently.
- A client-supplied forwarding header cannot spoof an ignored address.

## Security and privacy

- Public event endpoints are rate-limited and use constant-shape neutral responses.
- Click destinations are precomputed server-side to prevent open redirects.
- Provider webhooks require signature, timestamp, and replay validation.
- Organization authorization and tenant scoping apply to all administrative and reporting access.
- Submitted passwords are not stored by default. At most, the result records that a password-like field was populated. Any approved captured values are allowlisted, encrypted, access-audited, and retained briefly.
- Provider secrets and recipient addresses are redacted from logs.
- Organization, campaign, and sending-profile kill switches are available.
- Known automated scanners can be ignored by network, while probable scanner classification remains separate from raw accepted events.

## Rate limiting and load control

- Queue concurrency is bounded independently for materialization and network delivery.
- Global provider limits and per-profile distributed limits are enforced.
- Per-organization quotas and fair scheduling prevent one tenant from monopolizing workers.
- Provider throttling reduces feeder throughput and activates bounded backoff/circuit breaking.
- SMTP uses bounded pooled connections rather than one new connection per result.
- Maximum campaign size, pending delivery count, and catch-up count are configurable safeguards.

## Observability and reconciliation

Metrics cover schedule lag, occurrence state, materialization cursor, outbox age, queue latency, send throughput, provider errors, retry classification, no-op duplicate jobs, ignored tracking events, invalid references, and `DELIVERY_UNKNOWN` count.

Structured logs use opaque internal IDs and exclude recipient addresses, tracking references, provider secrets, and rendered content. Reconciliation jobs locate expired leases and unknown outcomes without automatically resending ambiguous non-idempotent submissions.

## Authorization

Existing organization-scoped campaign permissions govern schedule execution controls, campaign pause/resume/complete, recipient results, and event views. Ignored-network administration requires organization administration privileges. Public tracking routes do not use authenticated organization sessions and can resolve tenancy only after validating the neutral tracking reference.

## Acceptance criteria

| ID    | Acceptance criterion                                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Concurrent pollers create at most one durable occurrence for a schedule and UTC instant, persist source selection once, and advance recurrence atomically.                   |
| AC-02 | Duplicate or retried materialization jobs return or resume the same campaign and never duplicate campaign-level snapshots or normalized recipient results.                   |
| AC-03 | Large recipient sets materialize in resumable bounded batches and remain ineligible for sending until finalization succeeds.                                                 |
| AC-04 | Blast, Drip, and Batch produce deterministic persisted recipient send times from a stable order.                                                                             |
| AC-05 | Database outbox intent commits atomically with state changes, and repeated publication uses stable job identity without relying on Redis as the ledger.                      |
| AC-06 | Duplicate delivery jobs no-op after a result reaches a terminal or sent state.                                                                                               |
| AC-07 | Provider-safe transient errors retry with bounded exponential backoff and jitter; permanent errors do not retry.                                                             |
| AC-08 | Ambiguous non-idempotent submissions become `DELIVERY_UNKNOWN` and are not automatically resent.                                                                             |
| AC-09 | Each result has one unique stable logical Message-ID and a separate optional provider identifier; externally visible values are neutral.                                     |
| AC-10 | Each result has a unique cryptographically random 12-character `trackingRef` used through `?ref=` and excluded from ordinary logs.                                           |
| AC-11 | Campaign events are restricted to `SCHEDULED`, `SENT`, `OPENED`, `CLICKED`, `SUBMITTED`, `REPORTED`, and `FAILED`.                                                           |
| AC-12 | Delivery events are stored separately and cannot directly change negative-event or reported aggregates.                                                                      |
| AC-13 | `highestNegativeEvent` increases monotonically through `OPENED`, `CLICKED`, and `SUBMITTED`; `reported` is independent and preserves its first timestamp.                    |
| AC-14 | Event insertion and aggregate updates are transactional and idempotent under concurrent and repeated requests.                                                               |
| AC-15 | Organization administrators can configure normalized IPv4, IPv6, and CIDR ignored networks with audit history.                                                               |
| AC-16 | Matching ignored-network opens, clicks, and submissions receive normal responses but produce no campaign event or aggregate update.                                          |
| AC-17 | Untrusted forwarding headers cannot spoof an ignored client address.                                                                                                         |
| AC-18 | Click tracking resolves only precomputed link identifiers and cannot act as an open redirect.                                                                                |
| AC-19 | No public URL, response, header, Message-ID, HTML comment, asset name, hostname, or provider metadata introduced by this feature reveals the platform or simulation purpose. |
| AC-20 | Pause and cancellation prevent future unclaimed sends, while already accepted messages are not represented as recalled.                                                      |
| AC-21 | Unknown BullMQ job types fail, workers shut down gracefully, and expired leases are recoverable.                                                                             |
| AC-22 | Per-provider/profile rate limits, tenant fairness, backpressure, and configurable campaign safeguards operate across multiple worker processes.                              |
| AC-23 | Submitted passwords are not persisted by default and sensitive captured values follow encryption, auditing, and retention policy.                                            |
| AC-24 | Load and chaos tests demonstrate recovery from duplicate jobs, worker termination, Redis restart, database restart, provider throttling, and outbox backlog.                 |

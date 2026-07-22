# Campaign Execution and Delivery Research

## Repository baseline

At specification time:

- The application creates only `jobs` and `imports` BullMQ queues.
- Workers process site imports and target-group imports only.
- Schedules persist `nextOccurrenceAt`, but no worker claims or advances it.
- An occurrence materialization command and hidden resource snapshot implementation exist, but no production caller invokes them.
- Campaign uniqueness on `(scheduleId, occurrenceAt)` prevents duplicate committed campaigns for non-null occurrence keys, while concurrent check-then-create can still surface a uniqueness error instead of idempotent success.
- Materialization copies all target users in one transaction and is not resumable for very large groups.
- Mail providers and a dispatcher exist, but no campaign delivery pipeline calls them.
- Workers initialize the backend container without Redis and therefore do not register mail delivery services.
- There is no recipient-result, tracking-reference, campaign-event, delivery-event, attempt, or outbox model.
- SMTP can forward custom headers and returns its Message-ID; provider support and response correlation are inconsistent across the remaining adapters.

## Decision: database-led scheduling

BullMQ delayed/repeatable work is useful for wake-ups and transport, but Redis cannot be the only record that a schedule occurrence or recipient send exists. Queue retention, retries, and operational cleanup can remove jobs. PostgreSQL occurrence/result records and constraints therefore define truth; BullMQ jobs refer to those records by ID.

## Decision: transactional outbox

A database transaction cannot atomically commit to PostgreSQL and Redis. Writing an outbox row in the business transaction closes the database-to-queue loss window. Publication can repeat with a stable job ID, while consumers still validate database state.

## Decision: effectively-once external submission

BullMQ provides at-least-once processing. A provider call can succeed before the worker commits its result. RFC Message-ID supports identification and threading but does not require SMTP receivers to suppress duplicate messages. The design therefore:

- uses provider idempotency keys when available;
- retries failures proven to occur before acceptance;
- marks uncertain non-idempotent submissions `DELIVERY_UNKNOWN`;
- does not automatically resend uncertainty under the no-duplicates policy; and
- recommends a controlled durable relay when stronger guarantees are required.

## Decision: recipient result plus two event streams

A durable recipient row is appropriate because scheduling, sending, retries, tracking, and reporting all require recipient-level state. Shared immutable campaign resources remain campaign-level; only recipient merge data and execution state are copied per result.

High-level campaign events form the operator-visible timeline:

```text
SCHEDULED, SENT, OPENED, CLICKED, SUBMITTED, REPORTED, FAILED
```

Technical delivery events retain provider/SMTP detail separately. This prevents transport retries and webhooks from polluting behavioral reporting while preserving operational evidence.

## Decision: short neutral reference

An eight-character random reference is compact but provides a smaller collision/enumeration margin. Twelve Base58/Base62 characters provide roughly 70 bits of entropy while remaining visually ordinary in `?ref=`. A unique constraint and secure regeneration handle collisions. Neutral responses, rate limits, and log redaction reduce enumeration and leakage.

## Decision: ignored networks

Known mail scanners and inspection gateways can create false opens, clicks, and submissions. Organization-managed exact IP/CIDR entries suppress those three campaign event types before insertion. Reports remain independent. Forwarded headers are trusted only from deployment-configured reverse proxies to prevent spoofing.

## Decision: rolling delivery horizon

Creating every future send as a delayed Redis job can consume excessive memory and makes schedule edits/cancellation harder. Persist all recipient `scheduledAt` values in PostgreSQL and feed only bounded near-term work into BullMQ. This preserves backpressure and allows cancellation to act on authoritative state.

## Decision: stable Message-ID

Generate one opaque logical Message-ID per recipient result before dispatch, use a customer-controlled neutral domain, and reuse it for retries of the same logical message. Keep provider-assigned IDs separate. Do not expose the tracking reference or internal identity in Message-ID.

## Implementation references

- BullMQ idempotent jobs: https://docs.bullmq.io/patterns/idempotent-jobs
- BullMQ job IDs: https://docs.bullmq.io/guide/jobs/job-ids
- BullMQ deduplication: https://docs.bullmq.io/guide/jobs/deduplication
- BullMQ retrying failed jobs: https://docs.bullmq.io/guide/retrying-failing-jobs
- BullMQ rate limiting: https://docs.bullmq.io/guide/rate-limiting
- BullMQ job schedulers: https://docs.bullmq.io/guide/job-schedulers
- RFC 5322 Message-ID syntax and semantics: https://www.rfc-editor.org/rfc/rfc5322#section-3.6.4

These references inform queue and email semantics; repository constraints and the contracts in this feature remain authoritative for implementation.

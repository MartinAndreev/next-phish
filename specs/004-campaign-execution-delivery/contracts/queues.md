# Queue and Worker Contract

## Queue topology

| Queue           | Job                          | Payload                                 |
| --------------- | ---------------------------- | --------------------------------------- |
| Schedule        | Poll due schedules           | Version and wake-up identifier only.    |
| Materialization | Materialize occurrence       | Version and `occurrenceId`.             |
| Feeder          | Publish near-term recipients | Version and optional shard cursor.      |
| Delivery        | Send one recipient message   | Version and `campaignRecipientId`.      |
| Provider events | Process provider event       | Version and persisted inbound-event ID. |

Payloads contain no recipient address, rendered content, tracking reference, or provider configuration.

## Publication

- Business transaction inserts a unique outbox record.
- Publisher claims with an expiry lease and uses a stable hash as BullMQ `jobId`.
- A crash before outbox acknowledgement may republish safely.
- Job-ID deduplication does not replace database uniqueness or terminal-state checks.

## Handler rules

- Every handler validates a versioned payload.
- Unknown names and versions fail.
- Every handler loads current database state and is replay-safe.
- State is claimed through conditional update/row lock with an expiry lease.
- Terminal state returns success without repeating side effects.
- Graceful shutdown stops new claims and closes workers within the configured window.

## Retry rules

- Database deadlocks, temporary connectivity failures, provider 429/5xx, SMTP 4xx, and proven pre-acceptance network failures may retry.
- Invalid data, missing immutable resources, invalid provider credentials/configuration, provider 4xx policy rejection, and SMTP 5xx fail permanently.
- Potentially accepted non-idempotent submissions become `DELIVERY_UNKNOWN` and do not automatically retry.
- Backoff is exponential with jitter and bounded attempts.

## Load rules

- Polling, materialization, and delivery have independent bounded concurrency.
- Delivery rate limits are distributed across worker processes per provider/profile.
- Tenant fairness and configurable quotas prevent one organization from monopolizing the queue.
- The feeder publishes a bounded near-term horizon; PostgreSQL retains future schedules.

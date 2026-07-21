# ADR 004: Database-led campaign execution

## Status

Accepted for Feature 004.

## Decisions

### PostgreSQL is authoritative

BullMQ transports opaque, versioned identifiers. Schedule occurrences, recipient state, attempts, events, and queue publication intent are durable PostgreSQL records with uniqueness or conditional-transition boundaries. A transactional outbox bridges database commits to BullMQ; stable hashed job IDs are an optimization rather than the ledger.

### Effectively-once delivery

No general SMTP transaction can provide mathematical exactly-once delivery across a database and a remote server. Providers with idempotency support receive one stable delivery key. The logical RFC 5322 Message-ID is stable across safe retries but is used only for correlation.

For a non-idempotent provider, a result that may have been accepted but lost its acknowledgement transitions to `DELIVERY_UNKNOWN`. It is not automatically resent. An operator must reconcile it explicitly. Deployments requiring a stronger boundary should place a controlled durable relay in front of SMTP and deduplicate there by delivery key.

### Bounded catch-up

After downtime, the schedule poller advances through missed calendar instants but materializes only the latest due occurrence. The calculation loop has a defensive upper bound. This avoids a surprise send backlog while retaining deterministic recurrence and source selection.

### Immutable execution snapshots

Campaign resources and recipient fields are copied before delivery. A campaign becomes send-eligible only after recipient count and materialization completion are committed. Recipient ordering determines persisted Blast, Drip, or Batch send times.

### Public behavior tracking

Recipient-facing references are random 12-character Base62 values. Public routes have neutral names and constant-shape invalid behavior. Click destinations are stored server-side; requests cannot supply a redirect URL. Submitted request bodies are not parsed or retained by default.

## Consequences

- Redis loss can delay work but cannot erase committed intent.
- Duplicate jobs and webhook deliveries become no-ops at database boundaries.
- Ambiguous SMTP outcomes require operational reconciliation.
- Existing schedules are migration-disabled until an authorized edit reviews and enables them.

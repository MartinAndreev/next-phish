# Event Contract

## Campaign events

Campaign events are the recipient-visible high-level history. The closed type set is:

```text
SCHEDULED
SENT
OPENED
CLICKED
SUBMITTED
REPORTED
FAILED
```

| Type        | Creation boundary                                      |
| ----------- | ------------------------------------------------------ |
| `SCHEDULED` | Recipient result and final send time are committed.    |
| `SENT`      | Provider or SMTP server accepts the message.           |
| `OPENED`    | Non-ignored valid pixel request is accepted.           |
| `CLICKED`   | Non-ignored valid tracked-link request is accepted.    |
| `SUBMITTED` | Non-ignored valid tracked form submission is accepted. |
| `REPORTED`  | Valid report signal is accepted.                       |
| `FAILED`    | Delivery permanently fails or exhausts safe retries.   |

Every event requires a unique deduplication key. Insert and recipient projection update occur in one transaction.

### Recipient projection

```text
highestNegativeEvent: NONE | OPENED | CLICKED | SUBMITTED
highestNegativeEventAt: DateTime?
reported: Boolean
reportedAt: DateTime?
```

Severity only increases. `reported` is independent and preserves its first timestamp. `SCHEDULED`, `SENT`, `FAILED`, and `REPORTED` do not affect negative severity.

## Delivery events

Delivery events are technical transport history and remain in a separate table/module. Supported initial types are:

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

- They update delivery state only through an explicit transition service.
- They do not directly update negative severity or reported state.
- Provider webhook retries deduplicate by provider event identity.
- Internal attempt events deduplicate by recipient, attempt, and transition.
- Metadata is sanitized and cannot contain secrets, rendered content, tracking references, or complete SMTP sessions.

## Mapping

- Recipient scheduling creates campaign `SCHEDULED` and may create delivery `QUEUED`.
- Delivery `ACCEPTED` creates campaign `SENT` idempotently.
- Terminal delivery `REJECTED` or exhausted safe retries creates campaign `FAILED` idempotently.
- `DEFERRED` and `RETRY_SCHEDULED` do not create campaign events.
- `DELIVERY_UNKNOWN` does not create `SENT` or `FAILED` until reconciliation resolves the outcome.

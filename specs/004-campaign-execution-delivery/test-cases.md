# Test Cases

## Schedule and occurrence

| ID       | Scenario                                                   | Expected result                                                                                                                                                |
| -------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXEC-001 | Multiple pollers claim the same due schedule concurrently. | Exactly one occurrence exists for the schedule/instant and `nextOccurrenceAt` advances once.                                                                   |
| EXEC-002 | Poller crashes after committing occurrence/outbox.         | Recovery publishes the existing outbox record; no second occurrence is created.                                                                                |
| EXEC-003 | Random/Deck occurrence job retries.                        | The originally persisted source is reused.                                                                                                                     |
| EXEC-004 | Spring DST gap and fall overlap are evaluated.             | Instants follow Feature 003 compatible disambiguation and never duplicate an occurrence.                                                                       |
| EXEC-005 | Worker returns after extended downtime.                    | Only the configured bounded catch-up is created; no unlimited backlog appears.                                                                                 |
| EXEC-006 | Schedule is cancelled while a poller is claiming it.       | Either the committed eligible occurrence wins under the defined lock order or cancellation prevents it; no post-cancellation unclaimed occurrence is produced. |
| EXEC-007 | Schedule is edited between occurrences.                    | New occurrences record the new revision; started/terminal occurrences retain the old revision.                                                                 |

## Materialization

| ID      | Scenario                                                | Expected result                                                                         |
| ------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| MAT-001 | Same occurrence materialization job runs repeatedly.    | It returns/resumes one campaign and does not duplicate shared snapshots.                |
| MAT-002 | Two workers materialize the same occurrence.            | One claim proceeds; the other no-ops or loads the same state.                           |
| MAT-003 | Recipient batch is replayed after a crash.              | Unique campaign/normalized-email rows prevent duplicates and the cursor resumes safely. |
| MAT-004 | Group contains case/whitespace variants of one address. | One recipient result is created.                                                        |
| MAT-005 | Tracking-reference generation collides.                 | The database rejects the collision and generation retries without failing the campaign. |
| MAT-006 | Materialization stops halfway through a large group.    | No recipient is send-eligible until resumed materialization verifies and finalizes.     |
| MAT-007 | Blast, Drip, and Batch calculations replay.             | Every recipient receives the identical persisted `scheduledAt` value on retry.          |

## Outbox and BullMQ

| ID        | Scenario                                                         | Expected result                                                                                       |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| QUEUE-001 | Publisher crashes after `Queue.add` but before acknowledgement.  | Republish uses the same job ID and database state remains singular.                                   |
| QUEUE-002 | A completed BullMQ job has been removed and work is republished. | Database terminal state makes the handler no-op.                                                      |
| QUEUE-003 | Unknown job name is received.                                    | Job fails visibly and is not acknowledged as successful.                                              |
| QUEUE-004 | Worker receives SIGTERM during work.                             | It stops taking jobs, completes or safely loses leases, and exits within the configured grace period. |
| QUEUE-005 | Redis is unavailable after a database transaction.               | Outbox remains pending and publishes after recovery.                                                  |

## Delivery and Message-ID

| ID       | Scenario                                                  | Expected result                                                                                                   |
| -------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| SEND-001 | Duplicate delivery jobs target one result.                | Conditional claim permits one dispatch; later jobs no-op after terminal/sent state.                               |
| SEND-002 | Provider returns a proven transient pre-acceptance error. | Same logical message retries with bounded backoff, stable idempotency key, and stable Message-ID.                 |
| SEND-003 | Provider returns permanent rejection.                     | Result becomes failed once, one `FAILED` campaign event is created, and no retry is scheduled.                    |
| SEND-004 | SMTP accepts then connection confirmation is lost.        | Result becomes `DELIVERY_UNKNOWN`; it is not automatically resent.                                                |
| SEND-005 | Idempotent provider times out after acceptance.           | Retry uses the same provider idempotency key and does not create a second logical send.                           |
| SEND-006 | Campaign pauses after job claim but before dispatch.      | Pre-dispatch recheck prevents send and releases/defers work safely.                                               |
| SEND-007 | Campaign cancels with queued and accepted recipients.     | Queued safe work cancels; accepted results remain sent.                                                           |
| SEND-008 | Raw email is inspected.                                   | Message-ID is valid, stable, unique, neutral, and contains no recipient/campaign/platform/simulation information. |
| SEND-009 | Header value contains CR/LF.                              | Validation rejects it before provider invocation.                                                                 |
| SEND-010 | Provider assigns a different identifier.                  | Logical and provider identifiers are both retained without overwriting each other.                                |

## Campaign and delivery events

| ID      | Scenario                                                | Expected result                                                                        |
| ------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| EVT-001 | Recipient result finalizes.                             | One idempotent `SCHEDULED` campaign event exists.                                      |
| EVT-002 | Provider accepts a message twice through webhook retry. | One logical `SENT` campaign event exists; technical webhook receipts are deduplicated. |
| EVT-003 | Open arrives after click.                               | Event is retained but highest negative event remains `CLICKED`.                        |
| EVT-004 | Click and submit arrive concurrently.                   | Both accepted events persist and highest negative event is `SUBMITTED`.                |
| EVT-005 | Recipient reports after submitting.                     | Highest negative remains `SUBMITTED`; `reported=true` with first report timestamp.     |
| EVT-006 | Temporary delivery deferral occurs.                     | Delivery event is stored; no `FAILED` campaign event is created.                       |
| EVT-007 | Safe retries are exhausted.                             | Exactly one `FAILED` campaign event is created.                                        |
| EVT-008 | Delivery event is inserted.                             | It cannot directly alter highest negative event or reported fields.                    |
| EVT-009 | Unsupported campaign event type is submitted.           | Validation rejects it; only the seven approved types are accepted.                     |

## Tracking references and routes

| ID        | Scenario                                                     | Expected result                                                                                                              |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| TRACK-001 | Generated references are inspected at scale.                 | Each is 12 allowed characters, cryptographically random, and unique under the database constraint.                           |
| TRACK-002 | Valid, invalid, expired, and cancelled refs request a pixel. | Responses are neutral and do not reveal validity; only valid non-ignored activity records an event.                          |
| TRACK-003 | Click request supplies an arbitrary external URL.            | Request cannot redirect there; only immutable server-side link IDs resolve.                                                  |
| TRACK-004 | Logs and error reporting are inspected.                      | `ref` values are redacted from application, proxy, tracing, and error logs.                                                  |
| TRACK-005 | Public artifacts are searched for identifying terms.         | URLs, headers, HTML, comments, assets, responses, hostnames, and identifiers reveal neither platform nor simulation purpose. |
| TRACK-006 | Submission contains a password field.                        | Raw password is not persisted by default; only approved policy metadata is retained.                                         |

## Ignored networks and proxy trust

| ID     | Scenario                                                        | Expected result                                                                         |
| ------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| IP-001 | Admin saves IPv4, IPv6, and CIDR variants.                      | Values normalize, duplicates are rejected, changes are audited, and cache invalidates.  |
| IP-002 | Open, click, and submission originate inside an ignored range.  | Normal content/redirect is served; no campaign event or result aggregate update occurs. |
| IP-003 | Report originates inside an ignored range.                      | Report is recorded because reporting is not filtered by ignored networks.               |
| IP-004 | Direct client spoofs `X-Forwarded-For` with an ignored address. | Header is ignored and real direct address is evaluated.                                 |
| IP-005 | Trusted proxy supplies a valid forwarding chain.                | Correct first untrusted client address is normalized and evaluated.                     |
| IP-006 | IPv4-mapped IPv6 matches an ignored IPv4 range.                 | Matching behavior is consistent with canonical normalization policy.                    |

## Rate, load, and resilience

| ID       | Scenario                                       | Expected result                                                                                                              |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| LOAD-001 | Multiple large Blast campaigns start together. | Database/Redis memory remains bounded, rolling feeder applies fairness, and configured provider/profile rates are respected. |
| LOAD-002 | Provider responds with throttling.             | Throughput backs off, retries remain bounded, and unrelated providers continue.                                              |
| LOAD-003 | One organization creates a very large backlog. | Other organizations continue receiving fair worker capacity.                                                                 |
| LOAD-004 | PostgreSQL restarts during claims.             | Transactions roll back or recover without duplicate durable work.                                                            |
| LOAD-005 | Redis restarts with a pending outbox backlog.  | Work republishes from PostgreSQL and terminal handlers no-op duplicates.                                                     |
| LOAD-006 | Leases expire after worker termination.        | Reconciliation recovers safe work while ambiguous external attempts remain unknown.                                          |

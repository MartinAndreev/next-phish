# Research: BullMQ delivery reliability and phishing-simulation event processing

## Summary

Use at-least-once job execution as the design premise: make each recipient/action transition idempotent in PostgreSQL, emit jobs through a transactional outbox, and treat the provider submission response—not a completed BullMQ job—as the durable boundary for an attempted email send. BullMQ can prevent many duplicate enqueues and control load, but it cannot give end-to-end exactly-once email delivery; provider/API ambiguity and SMTP retries make a recipient-level idempotency ledger essential.

Research-tool limitation: the configured research worker has no available `web_search`/fetch tools, so the recommendations below are a concise, source-linked desk brief based on authoritative documentation URLs; URLs should be opened/verified during implementation planning.

## Findings

1. **Model processing as at-least-once and make database effects idempotent (severity: blocker if omitted).** BullMQ retries failed or stalled work and its worker guidance explicitly requires idempotent jobs. Give every job an immutable business key (`campaignRecipientId` plus action/version), and perform state mutation through a unique constraint/upsert or a conditional transition such as `UPDATE ... WHERE status = 'queued'`. A completed job is not proof that an email was delivered. [BullMQ idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs) · [BullMQ retries](https://docs.bullmq.io/guide/retrying-failing-jobs)

2. **Use an explicit transactional outbox for DB-to-queue handoff (severity: blocker if direct enqueue follows a committed DB transaction).** In the same PostgreSQL transaction that creates or advances a recipient action, insert an outbox row with a stable `event_key` under `UNIQUE(event_key)`. A publisher leases rows (e.g., `FOR UPDATE SKIP LOCKED`), calls `queue.add` using a deterministic `jobId`, and marks `published_at` only after the call succeeds. The publisher itself can retry safely because duplicate enqueue handling and the consumer ledger protect the effect. PostgreSQL's `SKIP LOCKED` is intended for queue-like multi-consumer access, but is not a general-purpose consistent-read mechanism. Prisma supports interactive transactions; keep them short and do not perform network calls inside them. [PostgreSQL `SELECT` locking / `SKIP LOCKED`](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE) · [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)

3. **Use BullMQ job IDs/deduplication as enqueue suppression, not correctness (severity: high).** Set an explicit deterministic `jobId`, but do not use `:` because BullMQ job IDs may not contain it. BullMQ's simple deduplication relies on a deduplication ID and is removed when the job completes or fails; throttle/debounce modes have different retention/extension behavior. Retention/removal settings can also permit a previously used custom job ID to be reused, so PostgreSQL uniqueness remains authoritative. [BullMQ job IDs](https://docs.bullmq.io/guide/jobs/job-ids) · [BullMQ deduplication](https://docs.bullmq.io/guide/jobs/deduplication) · [auto-removal implications](https://docs.bullmq.io/guide/queues/auto-removal-of-jobs)

4. **Separate schedule identity from run identity (severity: high).** For delayed work, persist the intended `run_at` and enqueue an idempotent action keyed by recipient/action/run version. For recurring campaigns, use current Job Schedulers rather than legacy repeatable jobs; scheduler configuration is distinct from generated job executions. Do not rely on a scheduler for every missed interval under load: BullMQ notes that a new repeatable job is produced when the prior job begins processing, so busy workers can make effective cadence slower than configured. [BullMQ delayed jobs](https://docs.bullmq.io/guide/jobs/delayed) · [BullMQ Job Schedulers](https://docs.bullmq.io/guide/job-schedulers) · [BullMQ repeatable jobs](https://docs.bullmq.io/guide/jobs/repeatable)

5. **Bound throughput at both queue and worker layers (severity: high).** Use worker `concurrency` only for parallelism appropriate to the work (especially low for CPU-heavy rendering); use queue global rate limiting to protect an email provider/domain quota. BullMQ global rate limiting accepts a maximum jobs per duration and applies across workers; group-key rate limiting was removed in BullMQ 3+. Monitor queue depth, delay, retries, stalled jobs, and provider 429/5xx responses; use exponential backoff with jitter and honor provider retry-after behavior through `worker.rateLimit()`/`RateLimitError` when appropriate. [BullMQ concurrency](https://docs.bullmq.io/guide/workers/concurrency) · [BullMQ rate limiting](https://docs.bullmq.io/guide/rate-limiting) · [manual rate limit](https://docs.bullmq.io/guide/rate-limiting/manual-rate-limit)

6. **Make the send boundary a recipient-action ledger (severity: blocker for duplicate-send control).** Before submitting, atomically claim an unsent recipient action; persist `sending`/attempt number and a stable provider idempotency key where the provider supports one. Persist provider response/message ID and transition to `submitted`; on timeout or unknown outcome, reconcile by provider idempotency key/message metadata before retrying rather than blindly sending. SMTP does not provide an application-level exactly-once guarantee: a client can lose the response after the server accepts `DATA`, and retry can duplicate the message. Therefore exactly-once _processing_ is achievable only for local state; email delivery is at-least-once/unknown unless the provider offers a durable idempotency/reconciliation contract. [SMTP RFC 5321](https://www.rfc-editor.org/rfc/rfc5321) · [RFC 5322 message identifiers](https://www.rfc-editor.org/rfc/rfc5322#section-3.6.4)

7. **Generate one RFC-compatible Message-ID per message attempt and retain it (severity: medium).** RFC 5322 defines `Message-ID` as `msg-id = [CFWS] "<" id-left "@" id-right ">"`; generation should use a globally unique left side and a domain controlled by the sender for the right side. Use cryptographic random/UUID material (not recipient PII), e.g. `<${uuidv7}.${attempt}@mail.example.test>`, store it before provider submission, and do not treat it as an idempotency key: a retry that might have been accepted should retain/reconcile the same submission identity according to provider behavior. [RFC 5322 §3.6.4](https://www.rfc-editor.org/rfc/rfc5322#section-3.6.4) · [RFC 5322 `msg-id` grammar](https://www.rfc-editor.org/rfc/rfc5322#section-3.6.4)

8. **Use an append-only recipient event stream plus a materialized current state (severity: high).** Record campaign-recipient events such as `scheduled`, `enqueue_requested`, `claimed`, `submission_attempted`, `provider_accepted`, `delivered`, `opened`, `clicked`, `reported`, `bounced`, `complained`, `unsubscribed`, `failed`, and `suppressed`. Include immutable event UUID, campaign/recipient/action IDs, occurrence time, source (`worker`, provider webhook, tracking endpoint), provider event ID, correlation token, attempt, and raw-payload reference/hash. Enforce uniqueness for external callbacks (`provider`, `provider_event_id`) and make tracking endpoints idempotent; derive aggregate counts/current recipient state rather than overwriting audit history. This supports webhook redelivery, out-of-order delivery events, and privacy/audit review.

9. **Phishing-simulation tracking requires privacy and safety boundaries (severity: high).** Use opaque per-recipient tracking tokens rather than email addresses in links/pixel URLs; minimize IP/user-agent retention and apply a documented retention/access policy. Make redirect and report endpoints validate the token, avoid arbitrary redirect targets, and record click/report events idempotently. Suppression/bounce/complaint states must be checked at claim/send time as well as at campaign creation, since a recipient can become ineligible after jobs are queued.

## Recommended implementation shape

- `campaign_recipient_action`: unique `(campaign_recipient_id, action_type, action_version)`; state, attempt count, claimed/submitted timestamps, provider submission ID, RFC Message-ID, last error.
- `outbox_event`: unique `event_key`; JSON payload, available/leased/published timestamps, attempts. Insert inside the same PostgreSQL transaction as action creation/state change.
- Outbox publisher: lease a bounded batch with `FOR UPDATE SKIP LOCKED`; enqueue with a deterministic, colon-free BullMQ `jobId`; mark published after successful `add`; retry lease expiry safely.
- Worker: conditional claim in one DB transaction; re-check suppression/eligibility; send outside DB transaction; record/reconcile result with a conditional update; return/retry only transient failures.
- Queue setup: distinct queues for scheduling/outbox publication, rendering, and provider submission; cap submission queue globally to provider quota and set worker concurrency from observed latency/quota, not CPU count.

## Sources

- Kept: BullMQ — Idempotent jobs (https://docs.bullmq.io/patterns/idempotent-jobs) — official at-least-once/idempotency guidance.
- Kept: BullMQ — Deduplication (https://docs.bullmq.io/guide/jobs/deduplication) — official semantics and modes.
- Kept: BullMQ — Job IDs (https://docs.bullmq.io/guide/jobs/job-ids) — deterministic-ID constraints.
- Kept: BullMQ — Job Schedulers (https://docs.bullmq.io/guide/job-schedulers) — current recurring scheduling API.
- Kept: BullMQ — Concurrency / Rate limiting (https://docs.bullmq.io/guide/workers/concurrency; https://docs.bullmq.io/guide/rate-limiting) — load-control behavior.
- Kept: PostgreSQL `SELECT` locking (https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE) — authoritative `SKIP LOCKED` behavior.
- Kept: Prisma transactions (https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — Prisma transaction constraints.
- Kept: RFC 5321 SMTP (https://www.rfc-editor.org/rfc/rfc5321) — protocol delivery boundary.
- Kept: RFC 5322 §3.6.4 (https://www.rfc-editor.org/rfc/rfc5322#section-3.6.4) — Message-ID syntax and generation requirements.
- Dropped: third-party queue/blog guidance — lower authority than BullMQ/PostgreSQL/Prisma/RFC primary documentation.

## Gaps

- Provider-specific idempotency, webhook event IDs, quota behavior, and reconciliation APIs are not specified; choose the mail provider before finalizing the submission ledger and retry policy.
- Confirm the installed BullMQ major version: Job Schedulers are the current replacement for repeatable-job APIs, but exact migration/API behavior must match the project dependency.
- The tool runtime did not provide required web search/fetch tools, so source pages were not live-verified in this run.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete, severity-labelled findings and implementation recommendations are recorded in .pi-subagents/artifacts/outputs/80a72ce7/.pi-subagents/plan-research.md with authoritative source URLs."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/80a72ce7/.pi-subagents/plan-research.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "web_search/fetch_content",
      "result": "not-run",
      "summary": "Unavailable in configured child-agent tool allowlist; no live source retrieval was claimed."
    }
  ],
  "validationOutput": [
    "Artifact written to the required authoritative path."
  ],
  "residualRisks": [
    "Live verification of linked documentation was not possible because web_search and fetch tools are unavailable.",
    "Provider-specific exactly-once/idempotency and webhook reconciliation semantics remain to be selected and verified.",
    "BullMQ API details must be checked against the installed package version."
  ],
  "noStagedFiles": true,
  "diffSummary": "Added the requested research artifact only; no repository source files were edited.",
  "reviewFindings": [
    "blocker: queue/email architecture - Do not claim exactly-once email delivery; implement idempotent local state plus provider reconciliation.",
    "high: direct database-then-enqueue flow - Use a PostgreSQL transactional outbox to close the commit/enqueue failure window.",
    "high: delayed/repeatable execution - Persist run/action identity because scheduler cadence and retries can produce late or duplicate attempts."
  ],
  "manualNotes": "Research tooling configuration error: requested web_search/fetch_content tools are not registered for this child run. The brief uses authoritative source URLs but flags that they were not live-checked."
}
```

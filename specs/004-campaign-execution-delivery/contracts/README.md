# Contracts

These files define the implementation boundaries for Feature 004.

| Contract                       | Accountable area                | Purpose                                                                     |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------- |
| [queues.md](queues.md)         | Worker/outbox                   | Queue topology, payload, retry, lease, and idempotency rules.               |
| [events.md](events.md)         | Delivery/campaign-event domains | Separate high-level campaign and technical delivery event contracts.        |
| [tracking.md](tracking.md)     | Static server/security          | Neutral reference, public route, link, ignored-network, and proxy behavior. |
| [data-model.md](data-model.md) | Database/backend                | Required entities, uniqueness, aggregate, and lifecycle boundaries.         |

Cross-cutting acceptance criteria live in [`../spec.md`](../spec.md); executable scenarios live in [`../test-cases.md`](../test-cases.md). Implementations may add internal fields and event detail but must not weaken the uniqueness, neutrality, no-automatic-ambiguous-resend, or event-separation contracts.

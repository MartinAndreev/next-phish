# Event and asynchronous-work contract

## Feature boundary

`create_target_group` is synchronous. It delegates to `targetGroup.create`; the
repository completes group and optional initial-user creation in one nested Prisma
operation. The MCP response is emitted only after that operation resolves.

| Responsibility                        | Owner / behavior                         |
| ------------------------------------- | ---------------------------------------- |
| Group and initial-user persistence    | Existing target-group command/repository |
| Success response                      | MCP adapter after tRPC result            |
| Queue/event/webhook/audit publication | None in this feature                     |

## Explicit exclusions

- Do not publish a domain event, enqueue a job, invoke a webhook, or create an audit
  record as part of this tool.
- `target_group_import` remains a separate file-import job and is not used to create
  initial MCP users.
- There is no producer, consumer, delivery guarantee, retry policy, or event payload
  contract for successful MCP creation.

D-06 remains open. If auditability or notification becomes required, create a
separate approved contract that names the owner, payload, timing, failure behavior,
privacy/retention, and delivery semantics.

# Feature 001 — Target Groups MCP

## Problem, user, and outcome

`targetGroup.create` is available through tRPC and the dashboard, but no MCP tool
registers or invokes it. Consequently, an authenticated AI agent cannot create a
target group for a selected organization or supply its initial users.

**User:** AI agents connected to the existing NextPhish MCP endpoint.

**Outcome:** An authorized agent can invoke `create_target_group` for an explicit
organization and optionally create the group's initial users, using the same
creation validation as `targetGroup.create`.

## Scope

In scope:

- Register one MCP write tool, `create_target_group`, on the existing `/api/mcp`
  endpoint.
- Require explicit `organizationId`; delegate authorization, organization selection,
  creation, and output to the existing `targetGroup.create` procedure.
- Accept optional initial users using the canonical target-group creation/user Zod
  schema and add automated contract, integration, and UI-regression coverage.

Out of scope:

- Database migrations; target-group API/dashboard redesign; bulk import; and other
  target-group MCP tools (list, read, update, delete, or user management).
- New endpoints, permissions, API-key formats, idempotency keys, audit records,
  events, queues, webhooks, or a MCP-specific output DTO.

## Acceptance criteria

| ID    | Acceptance criterion                                                                                                                                                                                                | Evidence               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| AC-01 | MCP discovery exposes `create_target_group` exactly once on `/api/mcp`.                                                                                                                                             | TG-MCP-01              |
| AC-02 | Input requires `organizationId` and `name`; accepts optional `status` and `users`; omitted `status` parses to `DRAFT`.                                                                                              | TG-MCP-01–04           |
| AC-03 | Creation fields and every nested user use the same executable Zod rules, transformations, defaults, and accept/reject behavior as direct `targetGroup.create`; MCP adds only `organizationId`.                      | TG-MCP-02, 07, 08      |
| AC-04 | The adapter calls `getCaller(input.organizationId)` and forwards the complete validated input, including `organizationId`, to `caller.targetGroup.create(input)`. It does not set organization or creator data.     | TG-MCP-10, code review |
| AC-05 | An authorized valid call creates exactly one group in the requested organization with the API-key owner as creator. Name/status persist after canonical parsing.                                                    | TG-MCP-03–05           |
| AC-06 | Valid supplied users are created only for the new group and are returned in the existing `TargetGroupView`; omitted `users` produces zero users.                                                                    | TG-MCP-03, 05          |
| AC-07 | Invalid input, authentication failure, absent `write:target-groups`, API-key organization restriction, unknown organization, or non-membership produces the established failure path and creates no group or users. | TG-MCP-07–14           |
| AC-08 | A nested persistence failure is atomic: neither the group nor a partial initial-user set persists.                                                                                                                  | TG-MCP-09              |
| AC-09 | Success is exactly one MCP `text` content item containing `JSON.stringify` of the unmodified tRPC result.                                                                                                           | TG-MCP-15              |
| AC-10 | Existing organization-scoped list and detail UI show the created group in the selected organization only, without source-specific UI behavior.                                                                      | TG-MCP-16              |

## Authoritative behavior and invariants

- The router's `writeProcedure` already verifies `write:target-groups`. For API-key
  calls, organization restrictions in API-key metadata are enforced when the
  middleware resolves `input.organizationId`; it then checks organization existence
  and membership and supplies `ctx.activeOrganizationId` to the command.
- `createServerCallerWithOrg(organizationId, headers)` returns the supplied ID beside
  a caller; it does **not** put that ID into caller context. Forwarding
  `organizationId` to the tRPC procedure is therefore security-critical.
- The current route schema is `CreateTargetGroupCommandSchema` in `@next-phish/backend`.
  `@next-phish/shared` contains a similar `createTargetGroupSchema`, but their nested
  validation messages differ. The route schema is the compatibility baseline until
  T001 records a single canonical owner; no third manually-maintained schema is
  permitted.
- The database unique constraint is `(targetGroupId, email)`. The repository creates
  the group and optional users in one nested Prisma `targetGroup.create` operation.
- `createdById` comes only from authenticated tRPC context. Agent input must not
  expose `createdById` or any equivalent caller-identity field.

## Non-functional constraints

- The MCP adapter is a thin transport adapter: no direct Prisma, repository, command,
  service, queue, or event invocation.
- Preserve existing `/api/mcp` transport, `x-api-key` authentication, mcp-handler
  registration, and JSON-text success convention.
- No validation semantic change is authorized as part of deduplicating schemas. Any
  approved compatibility change requires an explicit decision record and updated
  tests/contracts.

## Open decisions and decision gates

These are intentionally unresolved. They must be recorded before an implementation
changes the applicable behavior; they are not authorization to invent a policy.

| ID   | Decision required                         | Current observed behavior / implementation gate                                                                                                                                                     |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Canonical schema owner and migration path | Router uses backend `CreateTargetGroupCommandSchema`; shared has a near-duplicate. T001 must select one importable owner while preserving router behavior. Blocking for schema-consolidation merge. |
| D-02 | Duplicate emails within one `users` array | The database constraint can fail nested creation. Decide reject, deduplicate, or preserve database failure and define its client-visible treatment.                                                 |
| D-03 | `users: []` versus omitted `users`        | Both currently create zero users. Confirm whether this is the public contract; characterization coverage remains required.                                                                          |
| D-04 | MCP failure envelope/message              | Keep mcp-handler/tRPC behavior; tests may assert category and no writes, not unapproved serialized wording.                                                                                         |
| D-05 | Documentation update                      | Decide whether `docs/mcp-setup.md` needs a non-sensitive example/capability listing.                                                                                                                |
| D-06 | Audit/event expectation                   | No audit record or success event exists for this path. A new requirement needs a separately approved event/audit contract.                                                                          |

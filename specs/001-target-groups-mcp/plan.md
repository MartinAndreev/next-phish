# Implementation plan

## Design and execution flow

Add `registerTargetGroupTools` under `apps/next-app/src/server/mcp/tools/`, export
it from that directory's barrel, and register it from `src/server/mcp/index.ts`.
It registers only `create_target_group`.

```text
AI agent -> POST /api/mcp -> create_target_group
                              | parse canonical fields + organizationId
                              v
                         getCaller(organizationId)
                              |
                              v
                   caller.targetGroup.create(complete input)
                              |
                              +-> permission + API-key org restriction
                              +-> organization existence + membership
                              +-> CreateTargetGroupCommand
                              +-> one nested Prisma group/users create
                              v
                     JSON text of existing TargetGroupView
```

`getCaller(input.organizationId)` follows the existing MCP-tool convention, but it
is not a scoping operation. The complete input must be forwarded to the tRPC caller
so permission middleware can resolve `input.organizationId`.

## Schema boundary (merge gate)

The direct route currently consumes backend `CreateTargetGroupCommandSchema`; a
near-duplicate shared `createTargetGroupSchema` has different nested error messages.
Before merging schema work, the domain owner must record D-01 and make both tRPC and
MCP consume one executable schema. The selected source must preserve the route's
current parsing, defaults, inferred types, and messages unless a separately approved
compatibility change says otherwise.

Required relationship:

```ts
const mcpCreateTargetGroupSchema = canonicalCreateTargetGroupSchema.extend({
  organizationId: z.string(),
});
```

`organizationId` is procedure selection/authorization input. The router derives
command `organizationId` and `createdById` from context; the adapter never supplies
either as command data.

## Work slices and ownership

| Slice                 | Accountable role                              | Deliverable / exit condition                                                                           |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Contract decision     | Product/API owner + target-group domain owner | D-01–D-06 recorded; D-01 resolved before merge.                                                        |
| Schema boundary       | Target-group domain owner                     | One canonical create/user schema and inferred types used by route and MCP; no copied validation rules. |
| MCP adapter           | Backend/MCP owner                             | Tool module, barrel export, registration, exact input forwarding, and standard response.               |
| Verification          | QA owner                                      | Automated cases in `test-cases.md` pass; authorization and atomicity proven against registered tool.   |
| UI regression         | Frontend/QA owner                             | Existing views verified with MCP-created data; no production UI change.                                |
| Documentation/release | Documentation and release owners              | D-05 disposition honored; discovery checked in deployed environment if released.                       |

## Ordered implementation sequence

1. Complete T001/T002. Do not select a duplicate-email policy, error serialization,
   event, or documentation change by implication.
2. Complete T003/T004 to establish the schema boundary and exports.
3. Complete T005/T006 to add and register the thin adapter.
4. Complete T007 review before tests: adapter must not bypass tRPC or alter identity.
5. Complete T008–T011 and record commands/results; complete T012 only when D-05
   authorizes it.

## Risks and controls

| Risk                                                       | Control                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `getCaller` appears to scope the organization but does not | Require full input forwarding and TG-MCP-10.                    |
| Schema consolidation silently changes validation           | Schema-parity fixtures and an explicit D-01 decision record.    |
| Nested-user failure creates partial data                   | Integration case TG-MCP-09 checks database state.               |
| UI is accidentally expanded for an agent-only feature      | UI contract prohibits new UI; regression-only review.           |
| Duplicate-email/error policy is guessed                    | Keep D-02/D-04 open and test only approved observable behavior. |

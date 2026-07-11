# MCP tool contract — `create_target_group`

## Registration and ownership

| Item                         | Contract                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| Endpoint                     | Existing NextPhish MCP endpoint: `/api/mcp`                            |
| Registration                 | One `create_target_group` registration from `registerTargetGroupTools` |
| Adapter owner                | Backend/MCP                                                            |
| Creation/authorization owner | Existing `targetGroup.create` tRPC procedure and target-group domain   |
| Authentication               | Existing Better Auth API-key session via `x-api-key`                   |
| Permission                   | Existing `write:target-groups`                                         |

No new route, authentication mode, permission, API-key field, or agent-supplied
identity field is introduced.

## Input and shared-type contract

The executable tool schema is the canonical `targetGroup.create` creation schema
plus required `organizationId`; see [shared-types.md](shared-types.md). The shape
below explains the contract but is not a second validation source:

```ts
type CreateTargetGroupMcpInput = {
  organizationId: string;
  name: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED"; // parses to DRAFT when omitted
  users?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    position?: string;
  }>;
};
```

- `name`, `firstName`, `lastName`, and present `position` follow canonical trimming
  and non-empty rules; email follows its canonical email rule.
- `organizationId` is required procedure selection/authorization input, not
  caller-controlled command ownership. `createdById` is not accepted.
- Unknown-key handling, validation messages, duplicate-email behavior, and failure
  serialization are governed by the canonical schema/current stack and decisions
  D-01, D-02, and D-04; this feature must not independently redefine them.

## Invocation and security invariant

```ts
const { caller } = await getCaller(input.organizationId);
const result = await caller.targetGroup.create(input);
```

The second line receives the entire validated input. `getCaller` does not scope the
server caller. The tRPC permission middleware uses `input.organizationId` to enforce
API-key organization metadata restrictions, validate organization existence and
membership, derive `ctx.activeOrganizationId`, and enforce permission. The adapter
must not substitute an active organization, set `createdById`, call Prisma/repository/
command/service directly, or perform a parallel authorization check.

## Output contract

On success the adapter returns exactly:

```ts
{
  content: [{ type: "text", text: JSON.stringify(targetGroupView) }];
}
```

`targetGroupView` is the unmodified direct `targetGroup.create` result
(`TargetGroupView`): identifiers, name/status, organization/creator information,
user count, timestamps, and initial users. Input `position?: string` remains distinct
from output `position: string | null`; dates use normal `JSON.stringify` output.

## Failure and atomicity contract

The adapter introduces no catch/translation layer. MCP schema failures, tRPC
permission/organization failures, and persistence failures retain existing
mcp-handler/tRPC behavior. Exact external envelopes/messages remain D-04.

A failed creation leaves no group and no initial users. The nested Prisma create is
the atomicity boundary; any future duplicate-email policy must preserve it.

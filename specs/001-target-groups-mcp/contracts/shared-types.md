# Shared-type and validation contract

## Source of truth and decision gate

The direct router currently consumes backend `CreateTargetGroupCommandSchema`.
`@next-phish/shared` also exports a similar `createTargetGroupSchema`; nested error
messages are not identical. This is a known discrepancy, not permission to add a
third schema.

D-01 must select one canonical executable Zod schema owner before merging. That
schema must be importable by both the router and MCP layer without violating the
package dependency graph. Until the decision is recorded, the backend route schema
is the compatibility baseline: preserve its accepted/rejected values, transformations,
defaults, inferred types, and messages.

## Required schema relationship

```text
canonical create-target-group schema ---- targetGroup.create route input
                    |
                    +---- mcpCreateTargetGroupSchema
                           (= canonical schema + required organizationId)
```

Canonical creation fields are:

```ts
{
  name: z.string().trim().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  users: z.array(targetGroupUserSchema).optional(),
}

targetGroupUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  position: z.string().trim().optional(),
});
```

The implementation derives, rather than copies, tool input:

```ts
canonicalCreateTargetGroupSchema.extend({ organizationId: z.string() });
```

## Context, command, and output types

| Boundary       | Contract                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| MCP input      | Canonical fields plus required `organizationId`; no `createdById`.                                                                  |
| tRPC procedure | Consumes creation fields and uses middleware input `organizationId` to resolve authorized context.                                  |
| Command data   | Router adds `organizationId: ctx.activeOrganizationId` and `createdById: ctx.userId`; neither is agent-controlled domain ownership. |
| Output         | Existing `TargetGroupView`, serialized by MCP without wrapper or re-mapping.                                                        |

Input `position?: string` and output `position: string | null` are intentionally
different and must remain so.

## Compatibility boundaries

- No Prisma model/type, migration, coercion, new optionality, or independent MCP
  validation type is in scope.
- D-02 governs whether duplicate email gets a pre-validation rule, de-duplication,
  or current persistence failure. Do not add a refinement before that decision.
- If D-01 changes any message or semantic behavior, document the approved change and
  update schema-parity tests; silent drift is not acceptable.

# Shared-type contract

## Schema source of truth

Documentation derives input shapes from the MCP schemas exported by
`@next-phish/shared` (`packages/shared/src/schemas/mcp.schema.ts`) and the
`inputSchema` wired to each registered tool. Backend schemas may impose additional
validation after delegation; this feature documents the MCP boundary and the
observed handler caveats in [api.md](api.md).

## Reusable shapes

| Shape             | Fields and constraints                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `OrganizationId`  | required string `organizationId`                                                                      |
| `IdWithOrg`       | required string `id` and `organizationId`                                                             |
| `McpList`         | required `organizationId`; optional `search: string`, `limit: number` (1–100), `offset: number` (>=0) |
| `TargetGroupUser` | `email` valid email; trimmed non-empty `firstName`, `lastName`; optional trimmed `position`           |
| `Headers`         | record of string values: `Record<string, string>`                                                     |
| `ProviderConfig`  | required/optional-by-tool record of unknown JSON values: `Record<string, unknown>`                    |

## Documentation notation

- `required` means required by the MCP input schema.
- `optional` means the field may be omitted at the MCP boundary. Defaults in the
  tool schema are called out explicitly; an omitted field without a listed default
  has no documentation-created default.
- `string ID` is intentionally opaque; the guide must not claim UUID formatting.
- `null` is accepted only for `replyToEmail` and `headers` in
  `update_sending_profile` among the documented MCP input fields.

No generated TypeScript type, runtime shared-schema edit, or new public type is
needed for this documentation feature.

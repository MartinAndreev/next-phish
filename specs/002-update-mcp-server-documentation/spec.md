# Feature 002 — Update MCP server documentation

## Problem and outcome

`docs/mcp-setup.md` explains connection setup but no longer describes the complete
MCP surface. Users and AI agents cannot reliably determine which operations are
available or the JSON arguments each operation accepts.

Update the MCP guide so it documents the tools registered by the deployed
NextPhish MCP server, their input shapes, defaults, constraints, permissions, and
known scope. This is a documentation-only feature: it does not add, remove, or
change MCP tools, schemas, authorization, API routes, events, or UI.

## Scope

**In scope:** `docs/mcp-setup.md` and documentation-validation tests needed to
keep its tool catalogue aligned with the current registrations under
`apps/next-app/src/server/mcp/tools/`.

**Out of scope:** production MCP implementation changes; output-schema reference;
tool invocation examples containing credentials; client-specific setup changes;
and documenting unregistered tRPC operations as MCP tools.

## Acceptance criteria

| ID    | Criterion                                                                                                                                                                                                                                                                                       | Evidence       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| AC-01 | The guide identifies `/api/mcp`, `x-api-key` authentication, and that the discovered tool list is authoritative for a running version.                                                                                                                                                          | DOC-MCP-01     |
| AC-02 | The guide contains every currently registered tool exactly once: 23 tools in the catalogue in `contracts/mcp-tools.md`; it contains no unregistered tool.                                                                                                                                       | DOC-MCP-02–03  |
| AC-03 | Every catalogue entry gives its tool name, purpose, required and optional input fields, field types/enums, defaults where the MCP schema supplies one, and relevant validation constraints.                                                                                                     | DOC-MCP-04–08  |
| AC-04 | The guide accurately explains organization scoping: all registered tools except `create_organization` and `get_job_status` advertise a required `organizationId`, including `list_organizations`; it identifies fields accepted by the schema but ignored by the current handler.               | DOC-MCP-05, 09 |
| AC-05 | The guide accurately documents the MCP-specific update behavior: `update_email_template` supplies empty `name`/`html` and `{}` design when omitted; `update_page` supplies an empty `name` when omitted. It does not promise partial-update semantics beyond the registered schema and handler. | DOC-MCP-06–07  |
| AC-06 | The guide makes no claims that unsupported MCP operations exist (for example file upload/delete, sending-profile testing/verification, or target-group listing/update/user management).                                                                                                         | DOC-MCP-03, 10 |
| AC-07 | Existing setup, security, troubleshooting, and revocation guidance remains valid; examples use placeholders and never include a real credential.                                                                                                                                                | DOC-MCP-01, 11 |
| AC-08 | Documentation stays mechanically reviewable against the registrations and shared MCP schemas; the implementation adds/updates a focused automated check or an explicitly versioned catalogue fixture.                                                                                           | DOC-MCP-12     |

## Authoritative behaviour

- The implementation source of truth is the `server.registerTool` calls and their
  `inputSchema`s, not a similarly named tRPC procedure or shared domain schema.
- The current server returns one JSON text content item on success. The guide may
  state this transport convention, but response-object field reference is outside
  this feature.
- Zod object parsing strips unknown keys by default. Do not promote this internal
  behavior to a compatibility guarantee in user documentation.
- Permissions remain enforced by the existing tRPC procedures. The guide must name
  the resource/action permission where observable from the registered delegate;
  it must not claim that a key with broad access bypasses organization membership or
  organization restrictions.

## Non-functional requirements

- Use plain Markdown readable by people and useful to agents; retain an at-a-glance
  catalogue plus per-domain input tables. Do not require readers to inspect code.
- Keep credentials as placeholders and preserve the security warning.
- No production code or runtime schema changes are authorized in this feature.

## Open questions

None. Repository behavior and the documentation destination are sufficiently
determined: `docs/mcp-setup.md` is the existing public setup guide and the
registered MCP schemas define the requested input shapes.

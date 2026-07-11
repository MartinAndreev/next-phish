# QA test cases

## Preconditions

- Test the route registration rooted at `apps/next-app/src/server/mcp/index.ts` and
  the Markdown intended for `docs/mcp-setup.md` from the same commit.
- Use a valid non-production API key only when exercising `/api/mcp`; never record
  it in test evidence.
- Treat `tools/list` schema metadata and the imported MCP schema as the behavioral
  oracle. A tRPC procedure that has no registered MCP tool is not an expected tool.

| ID         | Layer                      | Scenario                                                                                                                     | Expected result                                                                                                                                                                               |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-MCP-01 | Content                    | Read setup, endpoint, authentication, security, and troubleshooting sections.                                                | `/api/mcp`, `x-api-key`, placeholders, discovery, revocation, and warnings are correct and no secret is present.                                                                              |
| DOC-MCP-02 | Parity                     | Extract registered names and documentation catalogue names.                                                                  | Both sets contain exactly the 23 names in `contracts/mcp-tools.md`, once each.                                                                                                                |
| DOC-MCP-03 | Negative scope             | Compare guide claims to registrations.                                                                                       | No unsupported file mutation, sending-profile test/verification, target-group read/update/delete/user, or other unregistered operation is represented as an MCP tool.                         |
| DOC-MCP-04 | Shape reference            | For every tool, compare documented required/optional field names and primitive/container shape to the input schema.          | Exact match, including nested target-group users and `providerConfig`/`headers` records.                                                                                                      |
| DOC-MCP-05 | Scope                      | Inspect organization wording and representative `tools/list` metadata.                                                       | All tools except `create_organization`/`get_job_status` document a required `organizationId`; `list_organizations` additionally states that its schema accepts it but its handler ignores it. |
| DOC-MCP-06 | Templates                  | Compare create/update template documentation to `mcpCreateEmailTemplateSchema`, `mcpUpdateEmailTemplateSchema`, and handler. | Defaults and enums are correct; optional update `name`/`html` caveat and implicit empty values/design are stated.                                                                             |
| DOC-MCP-07 | Pages                      | Compare create/update/import page documentation to schemas and handler.                                                      | Defaults/enums and `redirectUrl` optional string treatment are correct; update omitted-name fallback is stated; unexposed `design`/`redirectPageId` are not advertised.                       |
| DOC-MCP-08 | Profiles/groups/files/jobs | Compare domain tables to respective MCP schemas.                                                                             | Enums, defaults, constraints, requiredness, nullable update fields, and nested/map shapes are correct.                                                                                        |
| DOC-MCP-09 | Handler behavior           | Inspect each handler against any input caveat in docs.                                                                       | `list_organizations` ignores all advertised input; list tools forward documented filters; no caveat contradicts forwarding/default behavior.                                                  |
| DOC-MCP-10 | Discovery                  | Initialize MCP and call `tools/list` with a valid key in a test environment.                                                 | Registered names appear and examples/reference do not assert a nonexistent tool.                                                                                                              |
| DOC-MCP-11 | Security review            | Search changed documentation and fixtures for key-like literals and realistic secrets.                                       | Only explicit placeholders appear; no usable API key or access token is committed.                                                                                                            |
| DOC-MCP-12 | Regression                 | Deliberately remove, duplicate, and add a fake catalogue item in a temporary test copy/fixture.                              | Focused parity check fails each mismatch and passes the unchanged documentation.                                                                                                              |

## Execution guidance

- A text/AST test may parse a delimited catalogue region in Markdown. It must compare
  sets, not a fixed ordering, but the expected count is deliberately 23 for this
  release.
- Schema comparisons may be fixture-based when Zod introspection is impractical;
  fixtures must record the field names, requiredness, enums, and defaults from the
  actual imported schemas rather than hand-duplicated business behavior.
- No React code is in scope; `react-doctor` is not required unless implementation
  work unexpectedly changes React components.

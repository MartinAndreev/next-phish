# Implementation plan

## Documentation design

Revise `docs/mcp-setup.md` in place. Preserve setup/security content, replace the
high-level "What Can You Do?" examples with an exhaustive **Tool reference** and
add a short **calling conventions** section before it. The tool reference is a
documentation projection of the contracts in this feature, not a new API surface.

```text
registered server.registerTool + inputSchema
                 |
                 v
  docs/mcp-setup.md tool catalogue and field tables
                 |
                 +--> docs contract/registration parity test
                 |
                 +--> human/agent reads shapes before tools/list discovery
```

The guide must say that MCP `tools/list` for the connected deployment remains the
runtime authority. Documentation covers the repository version under release; it
does not promise forward compatibility with future tool sets.

## Documentation structure

1. Keep connection prerequisites, API-key creation, endpoint, client setup, test,
   troubleshooting, revocation, and security sections.
2. Add calling conventions: JSON object input, string IDs, explicit organization
   selection, authorization, successful JSON-text result, and discovery guidance.
3. Add a 23-row catalogue by domain, with tool name and concise purpose.
4. Add domain input tables using the reusable shapes and per-tool exceptions in
   `contracts/mcp-tools.md`; mark required vs optional, defaults, enum values, and
   handler caveats.
5. Add an explicit "not available through MCP" boundary for operations likely to
   be inferred from the dashboard/tRPC surface.

## Ownership and handoff

| Slice                  | Accountable role             | Deliverable / exit condition                                                                             |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| MCP inventory          | Backend/MCP owner            | Confirms current registrations, input schemas, delegates, permissions, and handler caveats against code. |
| Documentation          | Documentation owner          | Updates `docs/mcp-setup.md` exactly to the contracts, including all 23 tools.                            |
| Contract review        | Backend/MCP + security owner | Reviews scope/auth wording and confirms the guide does not imply capabilities or access expansion.       |
| Automated verification | QA owner                     | Adds a focused catalogue parity check or versioned fixture; executes DOC-MCP cases.                      |
| Release                | Documentation/release owner  | Records repository version/commit tested and confirms rendered Markdown links, tables, and examples.     |

## Ordered work

1. Complete T001–T002 and reconcile the registration inventory with
   `contracts/mcp-tools.md`; do not change code to make docs simpler.
2. Complete T003–T005 to author the guide and remove stale capability claims.
3. Complete T006–T008; correct docs/contract inventory discrepancies through the
   owning review, treating implementation as current behavior for this feature.
4. Complete T009–T010 with review and release evidence.

## Risks and controls

| Risk                                                   | Control                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| Docs describe tRPC/dashboard operations, not MCP tools | Generate/check inventory from `server.registerTool` names.           |
| Required organization ID is omitted from examples      | Use the per-tool table and DOC-MCP-05.                               |
| Optional MCP update fields imply a safe PATCH          | Document the handler fallback behavior verbatim in meaning; test it. |
| Credentials leak into docs                             | Placeholder-only review and DOC-MCP-11.                              |
| Future registrations drift from docs                   | Focused parity check/fixture and release review.                     |

# Tasks

## Inventory and contracts

- [ ] T001 — Backend/MCP owner: enumerate every `server.registerTool` currently
      reached from `apps/next-app/src/server/mcp/index.ts`; verify the 23 names,
      schemas, delegate procedures, and permission mapping in `contracts/mcp-tools.md`.
- [ ] T002 — Backend/MCP + security owner: review the organization-scope and update
      handler caveats in `contracts/api.md`; record any discovered code/doc mismatch as
      a defect, not an undocumented behavior change.

## Documentation

- [ ] T003 — Documentation owner: retain valid setup/security material and add
      calling conventions, discovery guidance, and the all-tools catalogue to
      `docs/mcp-setup.md`.
- [ ] T004 — Documentation owner: add precise input tables from
      `contracts/mcp-tools.md`, including requiredness, defaults, constraints, enums,
      and nested object/map fields.
- [ ] T005 — Documentation owner: replace stale broad examples/capability wording;
      document tool exclusions and handler caveats without exposing credentials.

## Verification and release

- [ ] T006 — QA owner: add a focused automated documentation catalogue check (or
      versioned fixture) that compares all registered names with the documentation
      catalogue; it must fail for a missing, duplicate, or unregistered name.
- [ ] T007 — QA owner: execute DOC-MCP-01 through DOC-MCP-12 and inspect generated
      `tools/list` metadata in a registered-tool test/harness for the current schemas.
- [ ] T008 — Backend/MCP owner: resolve any documentation discrepancy by correcting
      the documentation or separately filing an implementation defect; this feature
      does not alter runtime behavior.
- [ ] T009 — Documentation + security owners: review endpoint/auth, organization,
      permissions, unsupported-operation, and secret-handling statements.
- [ ] T010 — Release owner: run Markdown/link checks and the focused test command;
      attach commands, results, and the tested commit to the implementation change.

# Tasks

## Decisions and contracts

- [ ] T001 — Target-group domain owner: record D-01, select the one canonical
      executable creation/user Zod schema, and document compatibility with the current
      route schema. **Merge gate.**
- [ ] T002 — Product/API owner: resolve or explicitly defer D-02 through D-06 in
      `spec.md`; update tests/contracts for every resolved decision.
- [ ] T003 — Target-group domain owner: expose canonical schema and inferred input
      type where both route and MCP can consume them; remove the parallel creation schema
      rather than retain/copy it.

## Implementation

- [ ] T004 — Backend/MCP owner: define/export `mcpCreateTargetGroupSchema` as the
      canonical creation schema plus required `organizationId`; do not add coercion or
      change optionality.
- [ ] T005 — Backend/MCP owner: add `target-group.tools.ts`; register only
      `create_target_group`, call `getCaller(input.organizationId)`, and invoke
      `caller.targetGroup.create(input)` with the complete input.
- [ ] T006 — Backend/MCP owner: export `registerTargetGroupTools` and invoke it from
      MCP setup; return one JSON-stringified text success item.
- [ ] T007 — Domain/security reviewer: verify no direct data/command access,
      caller-controlled creator/organization override, context substitution, event,
      queue, audit record, or UI change was added.

## Verification and release

- [ ] T008 — QA owner: add schema parity/default/invalid-user tests TG-MCP-02 and
      TG-MCP-06–08 using the real canonical and derived schemas.
- [ ] T009 — QA owner: add registered-tool integration coverage TG-MCP-01 and
      TG-MCP-03–05, 09–15, including database assertions for every rejection.
- [ ] T010 — QA owner: execute targeted tests, `pnpm lint`, and `pnpm typecheck`;
      attach commands/results to the implementation change. Run `npx react-doctor@latest
--no-telemetry` only if React component code changes.
- [ ] T011 — Frontend/QA owner: perform TG-MCP-16 against existing organization A/B
      views; file a separate defect unless it blocks AC-10.
- [ ] T012 — Documentation/release owner: only if D-05 is approved, update the MCP
      guide with a non-sensitive example requiring `write:target-groups`; verify tool
      discovery after deployment and record any client refresh/cache observation.

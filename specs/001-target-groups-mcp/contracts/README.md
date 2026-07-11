# Contracts

These files are the implementation handoff for Feature 001. They define intended
production boundaries but do not themselves change production interfaces.

| Contract                           | Accountable role    | Purpose                                                        |
| ---------------------------------- | ------------------- | -------------------------------------------------------------- |
| [mcp-tool.md](mcp-tool.md)         | Backend/MCP         | Public tool, invocation/security, success and failure boundary |
| [shared-types.md](shared-types.md) | Target-group domain | Canonical validation/type ownership and compatibility boundary |
| [events.md](events.md)             | Backend/domain      | Synchronous execution and no-event/no-queue boundary           |
| [ui.md](ui.md)                     | Frontend/QA         | No-new-UI rule and existing-view regression behavior           |

Cross-cutting acceptance criteria, evidence mapping, and unresolved decisions live in
[../spec.md](../spec.md) and [../test-cases.md](../test-cases.md). Open decisions
are deliberately visible; implementation must not silently settle them.

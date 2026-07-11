# API and transport contract

| Item           | Existing contract to document                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Endpoint       | `/api/mcp`, handled for GET, POST, and DELETE.                                                           |
| Server         | `next-phish` MCP server, currently version `1.0.0`.                                                      |
| Authentication | Required `x-api-key`; a missing or invalid key receives the existing 401 response.                       |
| Discovery      | MCP client initializes then uses `tools/list`; this is runtime authority for the connected deployment.   |
| Success        | Registered handlers return one `content` item with `type: "text"` and JSON-stringified delegated result. |
| Failure        | Existing mcp-handler/tRPC validation, permission, and delegate error behavior; no new error envelope.    |

## Authorization and organization selection

The delegated tRPC procedure owns permission checks and organization membership/key
restriction behavior. Documentation must associate resource operations with their
existing permission: organizations, email templates, pages, files, jobs,
mail-sending, or target-groups, each read or write as implied by the operation.

`organizationId` is a required MCP input for every registered tool except
`create_organization` and `get_job_status`. It is used to build the server caller
and, for delegated scoped procedures, must remain in the call input. The documented
exception is `list_organizations`: its advertised `mcpListSchema` requires an
`organizationId`, but the handler ignores its entire parsed input and calls list with
`{ limit: 50 }`. The guide must state this truthfully rather than imply filtering.

## Handler caveats that are part of the documentation contract

- `update_email_template` advertises optional `name` and `html`, but invokes the
  delegate with `name: input.name ?? ""`, `html: input.html ?? ""`, and `design: {}`.
- `update_page` advertises optional `name`, but invokes the delegate with
  `name: input.name ?? ""`; it does not expose `design` or `redirectPageId`.
- The docs must not invent partial-update safety or output fields beyond this
  observed behavior.

No new endpoint, input/output type, event, permission, or API key format is created.

# UI contract

## Ownership and boundary

The feature user is an AI agent using MCP. Frontend owns regression verification,
not feature implementation. No page, form, component, route, translation, client
state, source marker, or special MCP rendering behavior is in scope.

## Existing-view regression contract

After a successful MCP creation, existing organization-scoped target-group list and
detail UI must treat it identically to a dashboard-created group:

| View/behavior                  | Expected result                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Selected organization list     | Group name, status, creator/organization information, and user count render through existing queries. |
| Selected organization detail   | Initial users and their existing nullable `position` representation render normally.                  |
| Other organization list/detail | The group is absent.                                                                                  |
| Source handling                | UI neither infers nor displays MCP as the creation source.                                            |

TG-MCP-16 is manual regression evidence for AC-10. Any UI defect should be filed
separately unless it prevents the stated behavior; no UI change is implied by this
feature.

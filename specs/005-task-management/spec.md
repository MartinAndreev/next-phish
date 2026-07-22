# Feature 005 — Organization Task Management

## Outcome

A shared organization Kanban board provides configurable statuses, status filtering, due dates, priorities, assignment, and one optional NextPhish resource link per task.

## Requirements

- Seed Todo, In Progress, and Done for existing and new organizations.
- Statuses are ordered organization data with a `marksTaskDone` completion flag.
- Members can read/write tasks; owner/admin can change statuses.
- A task can reference at most one campaign, schedule, page, email template, target group, or sending profile belonging to the organization.
- Resource deletion clears the link without deleting the task.
- Moving into a status that marks tasks done records completion; moving out clears completion.
- Status deletion requires reassignment when populated; the last status cannot be deleted.
- List operations support status, assignee, and search filters with bounded pagination.
- Dashboard and MCP operations enforce organization and API-key permissions.
- Task state never publishes, pauses, schedules, or completes a campaign.

## Acceptance criteria

1. Cross-organization status, assignee, resource, task, and replacement IDs are rejected.
2. Default statuses are initialized idempotently.
3. Custom statuses render and filter in configured order.
4. Every write invalidates board/status query caches.
5. MCP exposes task and status lifecycle operations.
6. Safe task DTOs never include template HTML, page HTML, recipient data, or provider secrets.

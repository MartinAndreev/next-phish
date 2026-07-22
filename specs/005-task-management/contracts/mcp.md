# MCP Contract

Tools: `list_tasks`, `get_task`, `create_task`, `update_task`, `move_task`, `delete_task`, `list_task_statuses`, `create_task_status`, `update_task_status`, `reorder_task_statuses`, and `delete_task_status`.

Every input includes `organizationId`. Task relations use `{ type, id }` with one of CAMPAIGN, SCHEDULE, PAGE, EMAIL_TEMPLATE, TARGET_GROUP, or SENDING_PROFILE. Status reordering supplies the complete ordered ID set. Deleting a populated status requires `replacementStatusId`.

Tools delegate to tRPC and therefore preserve membership, tenant, and API-key permission checks.

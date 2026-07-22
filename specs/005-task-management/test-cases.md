# Test Cases

| ID       | Scenario                                       | Expected                                     |
| -------- | ---------------------------------------------- | -------------------------------------------- |
| TASK-001 | First board load                               | Exactly three ordered defaults exist.        |
| TASK-002 | Create with foreign status/resource/assignee   | Rejected without disclosure.                 |
| TASK-003 | Filter multiple statuses                       | Only matching organization tasks return.     |
| TASK-004 | Move into/out of a completion status           | `completedAt` is set/cleared.                |
| TASK-005 | Delete populated status without replacement    | Rejected.                                    |
| TASK-006 | Delete populated status with valid replacement | Tasks move and status is removed atomically. |
| TASK-007 | Delete linked resource                         | Task remains with no relation.               |
| TASK-008 | Member changes statuses                        | Forbidden; task writes remain allowed.       |
| TASK-009 | API key lacks tasks permission                 | MCP operation is forbidden.                  |
| TASK-010 | MCP create with one valid relation             | Safe task DTO is returned.                   |
| TASK-011 | Two relation FKs supplied directly             | Database check rejects the row.              |
| TASK-012 | Concurrent/replayed default initialization     | No duplicate status is created.              |

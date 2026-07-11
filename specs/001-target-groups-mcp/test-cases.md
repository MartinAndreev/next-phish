# QA test cases

## Preconditions and evidence

- Organization A exists. Its API-key owner is a member with `write:target-groups`,
  except where a test changes that condition. Organization B exists and is outside a
  restricted key's organization metadata.
- Exercise the discovered tool through `/api/mcp` or an equivalent registered-tool
  harness. Inspect parsed output and persistent records.
- For every rejected invocation, compare before/after counts for both `TargetGroup`
  and `TargetGroupUser`; expect no new rows.

| ID        | Layer                  | Scenario / setup                                                                                  | Expected result                                                                                                                                  |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| TG-MCP-01 | Discovery              | Valid MCP initialize and tools/list request                                                       | `create_target_group` appears once; required `organizationId`/`name` and optional `status`/`users` are advertised.                               |
| TG-MCP-02 | Schema parity          | Run valid/invalid creation fixtures through current canonical route schema and derived MCP schema | The creation fields have identical parse result, trimming, status default, and accept/reject result; MCP additionally requires `organizationId`. |
| TG-MCP-03 | Success                | A; `{ organizationId: A, name: " Engineering " }`                                                 | One A group named `Engineering`, `DRAFT`, no users, API-key user as creator, normal text response.                                               |
| TG-MCP-04 | Success                | A; repeat for `DRAFT`, `ACTIVE`, and `ARCHIVED`                                                   | Each persisted and returned status matches input.                                                                                                |
| TG-MCP-05 | Success                | A; two valid users, one with `position`, one without                                              | Both belong only to new group; normalized values round-trip; omitted input position is output as existing nullable representation.               |
| TG-MCP-06 | Characterization       | Compare omitted `users` and `users: []`                                                           | Both currently create zero users. Do not promote this to a product rule until D-03 is recorded.                                                  |
| TG-MCP-07 | Validation             | Missing, empty, and whitespace-only name; unsupported status                                      | Fails before persistence.                                                                                                                        |
| TG-MCP-08 | Validation             | Invalid email; blank/whitespace first/last name; invalid/non-string position                      | Same outcome as direct create; no writes.                                                                                                        |
| TG-MCP-09 | Atomicity              | Otherwise valid call whose nested users cause persistence failure (for example duplicate email)   | No group or initial-user rows persist. Do not assert exact error text until D-02/D-04.                                                           |
| TG-MCP-10 | Organization selection | API-key session active org differs from requested A; input specifies A                            | Created group belongs to A, proving organizationId reached tRPC rather than only `getCaller`.                                                    |
| TG-MCP-11 | API-key restriction    | Key restricted to A requests B                                                                    | Established forbidden failure; no B group.                                                                                                       |
| TG-MCP-12 | Permission             | Valid member/key lacks `write:target-groups`                                                      | Established forbidden failure; no writes.                                                                                                        |
| TG-MCP-13 | Existence/membership   | Unknown org; then real org where caller is not member                                             | Existing not-found/forbidden path respectively; no writes.                                                                                       |
| TG-MCP-14 | Authentication         | Missing, malformed, expired, and revoked `x-api-key`                                              | Rejected before tool creation; no writes.                                                                                                        |
| TG-MCP-15 | Response               | Successful TG-MCP-03 and TG-MCP-05                                                                | Exactly one `text` item; parsing JSON yields direct create result shape without MCP wrapper fields.                                              |
| TG-MCP-16 | UI regression          | Complete TG-MCP-05, visit A list/detail and B list                                                | A renders normal name/status/count/users; B omits group; no source-specific behavior.                                                            |

## Automation guidance

- Unit tests import the actual canonical and derived schemas; do not reproduce
  validation logic or assert unresolved serialized messages.
- Registered-tool tests must assert complete input forwarding, then use a test
  database to prove persistence and atomicity.
- If implementation changes React components (not expected), run
  `npx react-doctor@latest --no-telemetry` under repository policy.

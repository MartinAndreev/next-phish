# Coding Standards

## Transactions

All data mutations MUST be executed within a Prisma transaction (`db.$transaction`).
This is enforced by the `MessageBus.dispatch()` method — commands go through it,
never call repositories directly from procedures or components.

## Validation

- Zod schemas live exclusively in each domain's `validations/` folder.
- Validation is the caller's responsibility (typically a tRPC procedure).
- Commands and queries always receive already-validated data.
- The MessageBus does not validate — it only routes and (for commands) wraps in a
  transaction.

## Server Components

Server components MUST use the DI container and the MessageBus for all data access.
They MUST NOT import `db` from `@next-phish/database` directly. Use:

```ts
import { Container } from "@/src/server/container";
import { MessageBus, SomeQuery } from "@next-phish/backend";

const bus = Container.get(MessageBus);
const handler = Container.get(SomeQuery);
const result = await bus.query(handler, data);
```

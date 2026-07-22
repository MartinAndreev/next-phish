# Plan

1. Add Prisma enums, task/status models, constraints, indexes, migration backfill, and SetNull resource relations.
2. Add shared Formik and MCP Zod schemas plus task permissions.
3. Implement a TypeDI task repository, commands, queries, and safe views.
4. Add organization-scoped tRPC procedures with separate task/status permissions.
5. Replace `/tasks` placeholder with an accessible filtered board and Formik dialogs.
6. Register MCP task/status tools and document their contracts.
7. Add repository tests and validate generate, typecheck, lint, React Doctor, and build.

No drag-and-drop, comments, attachments, subtasks, automation, or notifications are included in the MVP.

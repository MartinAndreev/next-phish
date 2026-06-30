# Target Groups Feature Plan

## Overview

Target groups are collections of target users (not connected to actual system users) that belong to an organization. Each group has a name, status, and contains group users with name, lastname, email, and position. Users can be added manually via a dynamic form or imported via CSV/Excel files using SheetJS. Import jobs run via BullMQ with real-time progress streamed to the client via tRPC SSE subscriptions (polling the Job table).

---

## 1. Database Schema (Prisma)

### New Enums

```prisma
enum TargetGroupStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### New Models

```prisma
model TargetGroup {
  id             String            @id @default(cuid())
  name           String
  status         TargetGroupStatus @default(DRAFT)
  organizationId String
  createdById    String
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  organization Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy    User              @relation("TargetGroupCreatedBy", fields: [createdById], references: [id], onDelete: Cascade)
  users        TargetGroupUser[]

  @@index([organizationId])
  @@index([createdById])
  @@index([status])
  @@map("target_group")
}

model TargetGroupUser {
  id            String   @id @default(cuid())
  targetGroupId String
  email         String
  firstName     String
  lastName      String
  position      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  targetGroup TargetGroup @relation(fields: [targetGroupId], references: [id], onDelete: Cascade)

  @@unique([targetGroupId, email])
  @@index([targetGroupId])
  @@index([email])
  @@map("target_group_user")
}
```

### Relations to Add

- **User model**: Add `targetGroups TargetGroup[] @relation("TargetGroupCreatedBy")`
- **Organization model**: Add `targetGroups TargetGroup[]`

### Migration

Run `pnpm db:migrate` to generate and apply migration.

---

## 2. Shared Package (`packages/shared`)

### New Schema: `src/schemas/target-group.schema.ts`

```ts
export const targetGroupStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const targetGroupUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  position: z.string().trim().optional(),
});
export const createTargetGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  status: targetGroupStatusSchema.default("DRAFT"),
  users: z.array(targetGroupUserSchema).optional(),
});
export const updateTargetGroupSchema = createTargetGroupSchema.extend({
  id: z.string(),
});
export const importTargetGroupUsersSchema = z.object({
  targetGroupId: z.string(),
  mode: z.enum(["insert", "upsert"]),
  file: z.string(), // base64 encoded file content
  fileName: z.string(),
});
```

### New Types: `src/types/target-group.types.ts`

```ts
export type TargetGroupStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type TargetGroupUserView = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string | null;
};
export type TargetGroupListItemView = {
  id: string;
  name: string;
  status: TargetGroupStatus;
  organizationId: string;
  createdById: string;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
};
export type TargetGroupView = TargetGroupListItemView & {
  users: TargetGroupUserView[];
};
export type CreateTargetGroupData = {
  name: string;
  status: TargetGroupStatus;
  organizationId: string;
  createdById: string;
  users?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    position?: string;
  }>;
};
```

### Update Barrel Exports

- `packages/shared/src/schemas/index.ts` — export new schemas
- `packages/shared/src/types/index.ts` — export new types
- `packages/shared/src/index.ts` — re-export everything

### Permissions

Add to `PERMISSION_GROUPS` in `packages/shared/src/constants/permissions.ts`:

```ts
{ resource: "target-groups", read: "read:target-groups", write: "write:target-groups" },
```

---

## 3. Backend Module (`packages/backend/src/target-group/`)

Follow the existing DDD module pattern:

```
target-group/
├── index.ts
├── target-group-service.provider.ts
├── repositories/
│   ├── index.ts
│   └── target-group.repository.ts
├── queries/
│   ├── index.ts
│   ├── get-target-groups.query.ts
│   ├── get-target-group-by-id.query.ts
│   └── get-target-group-users.query.ts
├── commands/
│   ├── index.ts
│   ├── create-target-group.command.ts
│   ├── update-target-group.command.ts
│   ├── delete-target-group.command.ts
│   └── import-target-group-users.command.ts
├── services/
│   ├── index.ts
│   └── target-group.service.ts
├── validations/
│   ├── index.ts
│   └── target-group.validations.ts
└── types/
    ├── index.ts
    └── target-group.types.ts
```

### Repository (`target-group.repository.ts`)

- `findByOrganizationId(orgId, { search, limit, offset })` — returns `{ rows, total }` with user count via `_count`
- `findById(id, orgId)` — returns group with users included
- `findUsersByGroupId(groupId, { search, limit, offset })` — paginated user list within a group
- `create(data)` — creates group + optional users in transaction
- `update(id, orgId, data)` — updates group metadata
- `delete(id, orgId)` — hard delete (cascade removes users)
- `upsertUsers(groupId, users[])` — bulk upsert users by email (for import)
- `insertUsers(groupId, users[])` — bulk insert users, skip duplicates (for import)
- `loadUsersByEmailMap(groupId, emails[])` — load existing users by email in chunks of 1000 using cursor, returns `Map<string, { id, email }>` for import lookup

### Service (`target-group.service.ts`)

- `toView(row)` — transforms full group with users
- `toListItemView(row)` — transforms list item with user count
- `toListItemViews(rows)` — batch transform
- `toUserView(row)` — transforms single user

### Commands

- **CreateTargetGroupCommand** — creates group with optional initial users
- **UpdateTargetGroupCommand** — updates group name/status
- **DeleteTargetGroupCommand** — deletes group
- **ImportTargetGroupUsersCommand** — processes the import job:
  1. Load the Job from DB to get input params (targetGroupId, mode, file content, fileName)
  2. Parse file using SheetJS (`XLSX.read(buffer, { type: 'buffer' })`)
  3. Validate rows (required columns: email, firstName, lastName; optional: position)
  4. If mode is "upsert": load existing users by email into a Map (chunks of 1000 cursor)
  5. Process in batches of 500: insert or update based on mode
  6. Update Job progress as it processes (total rows, processed, inserted, updated, errors)
  7. Report validation errors per row

### Queries

- **GetTargetGroupsQuery** — paginated list with search
- **GetTargetGroupByIdQuery** — single group with users
- **GetTargetGroupUsersQuery** — paginated users within a group

### Validations (`target-group.validations.ts`)

Zod schemas for:

- List input: `search, limit, offset, sort`
- Create input
- Update input
- Import input
- User list input: `search, limit, offset` (for paginating within a group)

### Provider Registration (`target-group-service.provider.ts`)

Wire all repos, services, queries, commands into TypeDI container.

### Backend Index Updates

Add all target-group exports to `packages/backend/src/index.ts`.

### Container Updates

Add `registerTargetGroupServices(db)` call to `packages/backend/src/container.ts`.

---

## 4. Worker Updates (`apps/worker/`)

### Install SheetJS

```bash
pnpm add xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Install in the `apps/worker` package (where the import processing happens).

### Worker Job Handler

Add `target_group_import` handler to `apps/worker/src/index.ts`:

```ts
target_group_import: async (job) => {
  const handler = Container.get(ImportTargetGroupUsersCommand);
  await handler.execute({ jobId: job.data.jobId });
},
```

The `ImportTargetGroupUsersCommand` will:

1. Load the Job from DB to get input params (targetGroupId, mode, file content, fileName)
2. Parse the file with SheetJS (`XLSX.read(buffer, { type: 'buffer' })`)
3. Validate columns and rows
4. Process in batches, updating Job.progress JSON along the way
5. Mark Job as COMPLETED or FAILED

### Job Progress Shape

```ts
interface ImportProgress {
  total: number; // total rows found
  processed: number; // rows processed so far
  inserted: number; // new users inserted
  updated: number; // existing users updated
  errors: number; // rows with errors
  currentBatch: number; // current batch number
  totalBatches: number; // total batches to process
  validationErrors?: Array<{ row: number; field: string; message: string }>;
}
```

---

## 5. tRPC Router (`apps/next-app/src/server/modules/target-group/`)

### New Router File: `target-group.router.ts`

Procedures:

| Procedure          | Type         | Input                                                      | Description                              |
| ------------------ | ------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `list`             | query        | `{ organizationId, search, limit, offset }`                | Paginated list of target groups          |
| `getById`          | query        | `{ organizationId, id }`                                   | Single group with users                  |
| `getUsers`         | query        | `{ organizationId, targetGroupId, search, limit, offset }` | Paginated users within a group           |
| `create`           | mutation     | `{ organizationId, name, status, users[] }`                | Create group with optional initial users |
| `update`           | mutation     | `{ organizationId, id, name, status }`                     | Update group metadata                    |
| `delete`           | mutation     | `{ organizationId, id }`                                   | Delete group                             |
| `importUsers`      | mutation     | `{ organizationId, targetGroupId, mode, file, fileName }`  | Start import job                         |
| `onImportProgress` | subscription | `{ jobId }`                                                | SSE stream for import progress           |

### Subscription Implementation (`onImportProgress`)

Uses tRPC v11 SSE subscription with Job table polling:

```ts
onImportProgress: readProcedure
  .input(z.object({ jobId: z.string() }))
  .subscription(async function* (opts) {
    const jobRepo = Container.get(JobRepository);
    let lastProgress: unknown = null;

    while (!opts.signal!.aborted) {
      const job = await jobRepo.findById(opts.input.jobId);
      if (!job) return;

      if (job.progress !== lastProgress) {
        lastProgress = job.progress;
        yield tracked(job.id, {
          status: job.status,
          progress: job.progress,
        });
      }

      if (job.status === "COMPLETED" || job.status === "FAILED") {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }),
```

### tRPC Router Registration

Add `targetGroup: targetGroupRouter` to `apps/next-app/src/server/trpc/router.ts`.

---

## 6. tRPC Client Setup for Subscriptions

### Update `trpc-provider.tsx`

Add `splitLink` and `httpSubscriptionLink` to support subscriptions:

```tsx
import { splitLink, httpSubscriptionLink, httpBatchLink } from "@trpc/react-query";

links: [
  splitLink({
    condition: (op) => op.type === "subscription",
    true: httpSubscriptionLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
    false: httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  }),
],
```

### Custom Hook: `use-import-progress.ts`

```ts
export function useImportProgress(jobId: string | null) {
  return trpc.targetGroup.onImportProgress.useSubscription(
    { jobId: jobId! },
    { enabled: !!jobId },
  );
}
```

---

## 7. Frontend Pages & Components

### Route: `/target-groups`

```
apps/next-app/app/(app)/(org)/target-groups/
├── page.tsx              # List page (server component)
├── loading.tsx           # Skeleton loading
├── new/
│   └── page.tsx          # Create new target group
└── [id]/
    └── page.tsx          # View/edit target group with user table
```

### List Page (`target-groups/page.tsx`)

- Server component with `force-dynamic`
- Uses `AppDataTable` + `useDataTable` pattern (same as pages/email-templates list)
- Columns: Name, Status, User Count, Created At, Updated At
- Actions: Edit, Delete
- Search by group name

### Create Page (`target-groups/new/page.tsx`)

- Container/Presentation split
- **Form fields**: Group name, Status dropdown
- **Dynamic user rows**: A section with "Add User" button that appends a new row with fields: Email, First Name, Last Name, Position. Each row has a remove button.
- Uses Formik with `useFieldArray`-like pattern (manual array management in Formik)
- Submit creates the group with users

### View/Edit Page (`target-groups/[id]/page.tsx`)

- Shows group metadata (name, status)
- **Users table**: `AppDataTable` with pagination and search
  - Columns: Email, First Name, Last Name, Position
  - Actions per row: Edit, Delete
- **Import button**: Opens dialog for CSV/Excel import
- **Add User button**: Opens dialog to add a single user

### New Organisms

```
src/components/organisms/target-groups/
├── target-group-form.tsx              # Container: create/edit form
├── target-group-form-presentation.tsx # Presentation: form fields + dynamic user rows
├── target-group-user-row.tsx          # Single user row component (for the form)
├── import-users-dialog.tsx            # Dialog for file upload + import mode selection
├── import-progress-view.tsx           # Progress bar/status during import
└── index.ts
```

### Dynamic User Rows in Form

Use Formik's array helpers. Each row has:

- Email (required, validated)
- First Name (required)
- Last Name (required)
- Position (optional)
- Remove button (trash icon)

"Add User" button below the rows.

### Import Dialog

- File upload using `FileUploader` component (accepts `.csv, .xlsx, .xls`)
- Import mode toggle: "Insert only" vs "Insert + Update (match by email)"
- File validation on client side (check file type, size)
- Submit sends file as base64 to `targetGroup.importUsers` mutation
- Shows `ImportProgressView` after submit with real-time progress via SSE

### Import Progress View

- Progress bar showing processed/total
- Stats: Inserted, Updated, Errors
- Validation errors list (if any)
- "Done" button when completed

---

## 8. Installation & Dependencies

### SheetJS (in `apps/worker`)

```bash
cd apps/worker
pnpm add xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

### No new client dependencies needed

- tRPC v11 already supports SSE subscriptions
- `httpSubscriptionLink` is available from `@trpc/react-query` v11.13.0
- PrimeReact `DataTable`, `FileUpload`, `Dialog`, `ProgressBar` are already available

---

## 9. Implementation Order

1. **Schema & Migration** — Prisma models + migration
2. **Shared package** — Schemas, types, permissions, barrel exports
3. **Backend module** — Repository, service, commands, queries, validations, provider, container registration
4. **tRPC router** — All procedures including subscription, register in root router
5. **tRPC client setup** — Update provider with splitLink for subscriptions
6. **Worker** — Install SheetJS, add job handler, implement import command
7. **Frontend pages** — List, Create, View/Edit pages with loading states
8. **Frontend organisms** — Form with dynamic rows, import dialog, progress view
9. **Testing & Polish** — Manual testing, error handling, edge cases

---

## 10. Key Decisions Summary

| Decision                 | Choice                                               |
| ------------------------ | ---------------------------------------------------- |
| Import mode              | User chooses: Insert only vs Upsert (per import)     |
| SSE approach             | tRPC subscription polling Job table (500ms interval) |
| Target group statuses    | DRAFT, ACTIVE, ARCHIVED                              |
| User duplicate detection | By `(targetGroupId, email)` unique constraint        |
| File format              | CSV, XLSX, XLS via SheetJS                           |
| Import batch size        | 500 users per batch                                  |
| Email lookup chunks      | 1000 users per cursor batch                          |
| Progress tracking        | Job.progress JSON field                              |
| UI table                 | PrimeReact DataTable with lazy pagination            |
| Form library             | Formik + Zod (existing pattern)                      |

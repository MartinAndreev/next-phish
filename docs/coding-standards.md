# Coding Standards

## State Management

### Simple form status (error/success)

Use the `useFormStatus` hook from `src/hooks/use-form-status.ts` instead of separate `useState` calls for `error` and `success` strings.

```tsx
// Bad
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

// Good
const { status, setError, setSuccess, reset } = useFormStatus();
```

Display status messages with discriminated union checks:

```tsx
{
  status.type === "error" && (
    <FormMessage variant="error">{status.message}</FormMessage>
  );
}
{
  status.type === "success" && (
    <FormMessage variant="success">{status.message}</FormMessage>
  );
}
```

### Complex multi-step state

Use `useReducer` with a custom hook when a component has:

- 3+ related state variables
- A `reset()` function that clears multiple state values
- State transitions that depend on current state

Extract the reducer and hook into `src/hooks/` (e.g., `use-two-factor-state.ts`).

Expose semantic actions instead of raw dispatch:

```tsx
// Bad
dispatch({ type: "SET_STEP", step: "done" });
dispatch({ type: "SET_SUCCESS", message: "Done!" });

// Good
complete("Done!");
```

### Debouncing

Debounce API calls triggered by user input using `useRef` + `setTimeout`:

```tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const debouncedCheck = useCallback((value: string) => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  if (!value) return;

  timeoutRef.current = setTimeout(async () => {
    // API call here
  }, 300);
}, []);
```

## Server Components & Pages

### Database access requires `force-dynamic`

Any page or layout that queries the database (directly or via tRPC/betterAuth) must opt out of static generation:

```tsx
export const dynamic = "force-dynamic";
```

Without this, Next.js tries to prerender the page at build time, which fails because no database is available in CI. This applies to any server component that calls Prisma, `auth.api.getSession()`, or a tRPC caller.

Currently there are no public-facing pages that need SEO/static generation, so `force-dynamic` is safe to use everywhere. If a public page is added later that needs static rendering, it must not query the database directly — use client-side fetching or ISR instead.

### Loading states with `loading.tsx`

Use Next.js `loading.tsx` files to show skeleton UI while server components fetch data. Next.js automatically wraps the page in `<Suspense>` when this file exists.

- Use PrimeReact `Skeleton` component for consistency
- Match the layout structure of the actual page (same dimensions, spacing)
- Place `loading.tsx` alongside the `page.tsx` it covers

```tsx
import { Skeleton } from "primereact/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton width="40%" height="2rem" className="mb-6" />
      <Skeleton width="100%" height="200px" borderRadius="1rem" />
    </div>
  );
}
```

Every route that queries the database (layouts or pages) should have a corresponding `loading.tsx`.

## Forms

### Always use Formik + Zod

All forms must use Formik for form state and Zod for validation. Do not use raw `useState` for form fields.

- Define Zod schemas in `packages/shared/src/schemas/`
- Use `toFormikValidation()` from `src/lib/to-formik-validation.ts` to convert Zod schemas for Formik's `validate` prop
- Use Formik's `<Form>`, `<Field>`, `<ErrorMessage>` components

```tsx
import { Formik, Form, Field, ErrorMessage } from "formik";
import { mySchema } from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";

<Formik
  initialValues={{ email: "" }}
  validate={toFormikValidation(mySchema)}
  onSubmit={handleSubmit}
>
  {({ isSubmitting }) => (
    <Form>
      <Field name="email" />
      <ErrorMessage name="email" component="p" />
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </Form>
  )}
</Formik>;
```

### Presentation components are single functions

Each `presentation.tsx` file must export one component. For multi-step forms or distinct views, split into separate files (e.g., `verify-otp-view.tsx`, `reset-password-view.tsx`) and import them into the presentation.

```
organisms/reset-password/
├── container.tsx
├── presentation.tsx        # single exported component, delegates to views
├── verify-otp-view.tsx     # OTP verification form
├── reset-password-view.tsx # new password form
└── index.ts
```

### Container / Presentation split

Complex interactive components (dialogs, multi-step forms, data-driven UIs) must be split into two files:

- **`container.tsx`** — owns the business logic. Wraps the presentation with `<Formik>`, calls tRPC mutations, handles navigation, manages error/success state via `useFormStatus`. It passes simple props down (e.g. `error`, `isLoading`).
- **`presentation.tsx`** — pure rendering. Uses `useFormikContext()` to read form state and render fields. Receives display-only props from the container (error strings, loading flags). No API calls, no navigation logic.

The container wraps the presentation inside `<Formik>`, so the presentation can call `useFormikContext()` directly:

```tsx
// container.tsx
"use client";

import { Formik } from "formik";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { MyPresentation } from "./presentation";

export function MyContainer() {
  const { status, setError } = useFormStatus();

  async function handleSubmit(values: MyValues) {
    const { error } = await doSomething(values);
    if (error) setError(error);
  }

  return (
    <Formik
      initialValues={{ field: "" }}
      validate={toFormikValidation(mySchema)}
      onSubmit={handleSubmit}
    >
      <MyPresentation error={status.type === "error" ? status.message : ""} />
    </Formik>
  );
}
```

```tsx
// presentation.tsx
"use client";

import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";

interface MyPresentationProps {
  error: string;
}

export function MyPresentation({ error }: MyPresentationProps) {
  const { isSubmitting } = useFormikContext();

  return (
    <Form>
      <Field as={InputText} name="field" />
      <ErrorMessage name="field" component="p" />
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <Button type="submit" loading={isSubmitting} />
    </Form>
  );
}
```

Rules:

- The container **owns** the `<Formik>` wrapper — the presentation never creates one.
- The presentation **reads** form state via `useFormikContext()` — it never holds its own form state.
- Keep props between container and presentation minimal: `error`, `isLoading`, visibility flags, callbacks for close/submit.
- If the component is simple (a single input, a toggle), skip the split — only use this pattern when the logic is non-trivial.
- Large presentations can be split into smaller sub-components (e.g. `permissions-field.tsx`, `expiration-field.tsx`). The main `presentation.tsx` composes them. Each sub-component can still use `useFormikContext()` since it's rendered inside the `<Formik>` tree.

## Client-Side Data Fetching

### Use tRPC + React Query

All client-side data fetching must go through tRPC with React Query. This provides loading states, caching, and query invalidation out of the box.

- tRPC client is in `src/lib/trpc.ts`
- `TRPCProvider` wraps the app in `app/layout.tsx`
- Use `trpc.<router>.<procedure>.useQuery()` for reads
- Use `trpc.<router>.<procedure>.useMutation()` for writes
- Invalidate queries after mutations with `utils.<router>.<procedure>.invalidate()`

### Custom hooks wrap tRPC queries

Create domain-specific hooks in `src/hooks/` that wrap tRPC queries and expose a clean API:

```tsx
// src/hooks/use-my-organizations.ts
export function useMyOrganizations() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.organization.list.useQuery({ limit: 50 });
  const create = trpc.organization.create.useMutation({
    onSuccess: () => utils.organization.list.invalidate(),
  });

  return { organizations: data?.organizations ?? [], isLoading, create };
}
```

### Backend module structure

Follow DDD patterns for new backend modules in `packages/backend/src/<domain>/`:

```
organization/
├── repositories/         # Prisma data access (raw queries)
├── services/             # Transformation logic (unit testable)
├── queries/              # Read operations (IQueryHandler)
├── commands/             # Write operations (ICommandHandler)
├── types/                # TypeScript interfaces
├── validations/          # Zod schemas
├── index.ts              # Public exports
└── <domain>-service.provider.ts  # TypeDI registration
```

- **Repository** — raw Prisma queries, returns domain types
- **Service** — transforms raw data to view types (e.g., `$me` membership)
- **Query** — orchestrates repository + service, registered via TypeDI
- **Command** — write operations, registered via TypeDI
- **tRPC router** — calls queries/commands via message bus

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

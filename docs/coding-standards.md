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

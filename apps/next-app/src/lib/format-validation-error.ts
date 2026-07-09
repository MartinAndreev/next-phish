export function formatValidationError(err: unknown): string {
  if (!err || typeof err !== "object") return "An unexpected error occurred";

  const anyErr = err as Record<string, unknown>;

  const data = anyErr.data as Record<string, unknown> | undefined;
  const issues = data?.zodError as
    | Array<{ message: string; path: Array<string | number> }>
    | undefined;

  if (issues?.length) {
    return issues.map((issue) => issue.message).join("; ");
  }

  return String(anyErr.message ?? "An unexpected error occurred");
}

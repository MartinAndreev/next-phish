type SafeParseResult =
  | { success: true; data: unknown }
  | {
      success: false;
      error: {
        issues: Array<{ path: Array<string | number>; message: string }>;
      };
    };

interface ZodCompatible {
  safeParse(data: unknown): SafeParseResult;
}

export function toFormikValidation(
  schema: ZodCompatible,
): (values: unknown) => Record<string, string> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    }
    return errors;
  };
}

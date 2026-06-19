"use client";

import { useState, useCallback } from "react";

export type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const idle: FormStatus = { type: "idle", message: "" };

export function useFormStatus(initial: FormStatus = idle) {
  const [status, setStatus] = useState<FormStatus>(initial);

  const setError = useCallback(
    (message: string) => setStatus({ type: "error", message }),
    [],
  );

  const setSuccess = useCallback(
    (message: string) => setStatus({ type: "success", message }),
    [],
  );

  const reset = useCallback(() => setStatus(idle), []);

  return { status, setStatus, setError, setSuccess, reset } as const;
}

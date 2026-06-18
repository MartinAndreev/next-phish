import type { ReactNode } from "react";

type MessageVariant = "error" | "success";

interface FormMessageProps {
  variant: MessageVariant;
  children: ReactNode;
}

const variantClassName: Record<MessageVariant, string> = {
  error:
    "rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200",
  success:
    "rounded-lg border border-green-400/30 bg-green-500/10 px-3 py-2 text-sm text-green-200",
};

export const errorClassName = variantClassName.error;

export function FormMessage({ variant, children }: FormMessageProps) {
  return <p className={variantClassName[variant]}>{children}</p>;
}

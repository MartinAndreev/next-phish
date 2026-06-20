import type { ReactNode } from "react";
import { errorClassName, successClassName } from "./form-message.styles";

type MessageVariant = "error" | "success";

interface FormMessageProps {
  variant: MessageVariant;
  children: ReactNode;
}

const variantClassName: Record<MessageVariant, string> = {
  error: errorClassName,
  success: successClassName,
};

export function FormMessage({ variant, children }: FormMessageProps) {
  return <p className={variantClassName[variant]}>{children}</p>;
}

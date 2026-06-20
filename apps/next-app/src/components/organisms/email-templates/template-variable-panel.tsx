"use client";

import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";

const variables = ["{{.Email}}", "{{.FirstName}}", "{{.LastName}}", "{{.URL}}"];

export function TemplateVariablePanel() {
  const t = useTranslation();
  const { status, setError, setSuccess } = useFormStatus();

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(t("emailTemplates.copiedVariable", { value }));
    } catch {
      setError(t("emailTemplates.copyFailed"));
    }
  }

  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">
          {t("emailTemplates.variablePanelTitle")}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {t("emailTemplates.variablePanelHint")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {variables.map((value) => (
          <Button
            key={value}
            type="button"
            onClick={() => handleCopy(value)}
            className="justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/10"
          >
            <span className="truncate">{value}</span>
            <i className="pi pi-copy text-xs" />
          </Button>
        ))}
      </div>

      {status.type === "error" && (
        <FormMessage variant="error">{status.message}</FormMessage>
      )}
      {status.type === "success" && (
        <FormMessage variant="success">{status.message}</FormMessage>
      )}
    </section>
  );
}

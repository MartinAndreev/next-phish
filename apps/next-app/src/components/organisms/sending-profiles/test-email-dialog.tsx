"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { FormMessage } from "@/src/components/atoms/form-message";
import { formatValidationError } from "@/src/lib/format-validation-error";

interface TestEmailDialogProps {
  profileId: string;
  visible: boolean;
  onHide: () => void;
}

export function TestEmailDialog({
  profileId,
  visible,
  onHide,
}: TestEmailDialogProps) {
  const t = useTranslation();

  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sendTestMutation = trpc.mailSending.sendTest.useMutation({
    onSuccess: () => {
      setTestResult({
        type: "success",
        message: t("sendingProfiles.testEmailSuccess"),
      });
    },
    onError: (err: unknown) => {
      setTestResult({
        type: "error",
        message: formatValidationError(err),
      });
    },
  });

  function handleClose() {
    setTestEmail("");
    setTestResult(null);
    onHide();
  }

  function handleSendTest() {
    setTestResult(null);
    sendTestMutation.mutate({
      profileId,
      toEmail: testEmail.trim(),
    });
  }

  return (
    <Dialog
      header={t("sendingProfiles.testEmailLabel")}
      visible={visible}
      onHide={handleClose}
      className="max-w-md"
      draggable={false}
      dismissableMask
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-lg border border-brand-blue/30 bg-brand-blue/10 p-3 text-sm text-brand-blue">
          {t("sendingProfiles.testEmailDescription")}
        </p>
        <div>
          <label
            htmlFor="testEmail"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            {t("sendingProfiles.testEmailRecipient")}
          </label>
          <InputText
            id="testEmail"
            size="small"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t("sendingProfiles.testEmailPlaceholder")}
            className="w-full"
          />
        </div>
        {testResult?.type === "success" && (
          <FormMessage variant="success">{testResult.message}</FormMessage>
        )}
        {testResult?.type === "error" && (
          <FormMessage variant="error">{testResult.message}</FormMessage>
        )}
        <div className="flex justify-end gap-3">
          <Button
            size="small"
            type="button"
            label={t("common.cancel")}
            severity="secondary"
            onClick={handleClose}
          />
          <Button
            size="small"
            type="button"
            label={
              sendTestMutation.isPending
                ? t("sendingProfiles.testEmailSending")
                : t("sendingProfiles.testEmailSend")
            }
            loading={sendTestMutation.isPending}
            disabled={!testEmail.trim()}
            onClick={handleSendTest}
          />
        </div>
      </div>
    </Dialog>
  );
}

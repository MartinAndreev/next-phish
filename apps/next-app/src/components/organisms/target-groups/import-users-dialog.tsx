"use client";

import { useState, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { ImportUsersForm } from "./import-users-form";
import { ImportUsersResult } from "./import-users-result";

interface ImportUsersDialogProps {
  visible: boolean;
  onHide: () => void;
  targetGroupId: string;
}

interface ImportProgressData {
  status: string;
  progress: {
    total: number;
    processed: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
    currentBatch: number;
    totalBatches: number;
    validationErrors?: Array<{ row: number; field: string; message: string }>;
  } | null;
}

export function ImportUsersDialog({
  visible,
  onHide,
  targetGroupId,
}: ImportUsersDialogProps) {
  const t = useTranslation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"insert" | "upsert">("insert");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.file.uploadFile.useMutation();
  const importMutation = trpc.targetGroup.importUsers.useMutation({
    onSuccess: (data) => setJobId(data.jobId),
  });

  const { data: progressData } = trpc.job.getById.useQuery(
    { id: jobId! },
    {
      enabled: !!jobId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "COMPLETED" || status === "FAILED") return false;
        return 5000;
      },
    },
  );

  const progress = progressData?.progress as
    | ImportProgressData["progress"]
    | null;
  const jobStatus = progressData?.status;

  const step = useMemo(() => {
    if (!jobId) return "configure" as const;
    if (jobStatus === "COMPLETED" || jobStatus === "FAILED")
      return "done" as const;
    return "importing" as const;
  }, [jobId, jobStatus]);

  const isDone = step === "done";
  useMemo(() => {
    if (isDone) utils.targetGroup.invalidate();
  }, [isDone, utils.targetGroup]);

  async function handleImport() {
    if (!file) return;

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const uploaded = await uploadMutation.mutateAsync({
        name: file.name,
        size: file.size,
        format: file.type || "application/octet-stream",
        purpose: "IMPORT",
        data: base64,
      });

      importMutation.mutate({
        targetGroupId,
        mode,
        fileId: uploaded.id,
        fileName: file.name,
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleClose() {
    setFile(null);
    setJobId(null);
    setMode("insert");
    onHide();
  }

  const resultStatus =
    jobStatus === "COMPLETED"
      ? "completed"
      : jobStatus === "FAILED"
        ? "failed"
        : "importing";

  const footer =
    step === "configure" ? (
      <div className="flex justify-end gap-3">
        <Button
          size="small"
          label={t("common.cancel")}
          severity="secondary"
          onClick={handleClose}
        />
        <Button
          size="small"
          label={t("targetGroups.importStart")}
          icon="pi pi-upload"
          disabled={!file}
          loading={isUploading || importMutation.isPending}
          onClick={handleImport}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      </div>
    ) : (
      <div className="flex justify-end">
        <Button
          size="small"
          label={t("targetGroups.importDone")}
          onClick={handleClose}
        />
      </div>
    );

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={t("targetGroups.importTitle")}
      footer={footer}
      className="w-full max-w-lg"
      draggable={false}
      dismissableMask={true}
    >
      {step === "configure" && (
        <ImportUsersForm
          mode={mode}
          onModeChange={setMode}
          file={file}
          onFileChange={setFile}
        />
      )}
      {(step === "importing" || step === "done") && (
        <ImportUsersResult status={resultStatus} progress={progress} />
      )}
    </Dialog>
  );
}

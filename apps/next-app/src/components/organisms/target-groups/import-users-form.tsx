"use client";

import { RadioButton } from "primereact/radiobutton";
import { FileUpload } from "primereact/fileupload";
import { useTranslation } from "@/src/lib/i18n";

interface ImportUsersFormProps {
  mode: "insert" | "upsert";
  onModeChange: (mode: "insert" | "upsert") => void;
  file: File | null;
  onFileChange: (file: File) => void;
}

export function ImportUsersForm({
  mode,
  onModeChange,
  file,
  onFileChange,
}: ImportUsersFormProps) {
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 text-sm font-medium text-zinc-300">
          {t("targetGroups.importMode")}
        </h4>
        <div className="flex flex-col gap-3">
          <div
            className={`cursor-pointer rounded-lg border p-4 ${
              mode === "insert"
                ? "border-brand-blue bg-brand-blue/10"
                : "border-[#1C2945] bg-brand-navy/50"
            }`}
            onClick={() => onModeChange("insert")}
          >
            <div className="flex items-center gap-3">
              <RadioButton
                checked={mode === "insert"}
                onChange={() => onModeChange("insert")}
              />
              <div>
                <p className="font-medium text-white">
                  {t("targetGroups.importModeInsert")}
                </p>
                <p className="text-xs text-zinc-400">
                  {t("targetGroups.importModeInsertHint")}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`cursor-pointer rounded-lg border p-4 ${
              mode === "upsert"
                ? "border-brand-blue bg-brand-blue/10"
                : "border-[#1C2945] bg-brand-navy/50"
            }`}
            onClick={() => onModeChange("upsert")}
          >
            <div className="flex items-center gap-3">
              <RadioButton
                checked={mode === "upsert"}
                onChange={() => onModeChange("upsert")}
              />
              <div>
                <p className="font-medium text-white">
                  {t("targetGroups.importModeUpsert")}
                </p>
                <p className="text-xs text-zinc-400">
                  {t("targetGroups.importModeUpsertHint")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-zinc-300">
          {t("targetGroups.importFile")}
        </h4>
        <FileUpload
          mode="basic"
          auto
          customUpload
          accept=".csv,.xlsx,.xls"
          maxFileSize={10_000_000}
          chooseLabel={t("targetGroups.importFile")}
          uploadHandler={(e) => {
            const selected = e.files[0];
            if (selected) onFileChange(selected);
          }}
        />
        {file && (
          <p className="mt-2 text-sm text-zinc-400">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-500">
          {t("targetGroups.importFileHint")}
        </p>
      </div>
    </div>
  );
}

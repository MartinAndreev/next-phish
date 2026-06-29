"use client";

import { useState, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { trpc } from "@/src/lib/trpc";
import { useTranslation } from "@/src/lib/i18n";
import { ApiKeyFormContainer } from "./api-key-form-container";
import { ApiKeyCreatedModal } from "./api-key-created-modal";

interface ApiKey {
  id: string;
  name: string | null;
  start: string | null;
  prefix: string | null;
  enabled: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  requestCount: number;
  rateLimitEnabled: boolean;
  rateLimitMax: number | null;
}

export function ApiKeyList() {
  const t = useTranslation();
  const toast = useRef<Toast>(null);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.apiKey.list.useQuery();

  const deleteMutation = trpc.apiKey.delete.useMutation({
    onSuccess: () => {
      toast.current?.show({
        severity: "success",
        summary: t("apiKeys.deleted"),
      });
      utils.apiKey.list.invalidate();
    },
  });

  const keys: ApiKey[] =
    (data as { apiKeys: ApiKey[] } | undefined)?.apiKeys ?? [];

  const handleDelete = useCallback(
    (key: ApiKey) => {
      confirmDialog({
        message: t("apiKeys.deleteConfirm", {
          name: key.name ?? key.start ?? key.id,
        }),
        header: t("apiKeys.deleteTitle"),
        icon: "pi pi-exclamation-triangle",
        acceptClassName: "p-button-danger",
        accept: () => {
          deleteMutation.mutate({ keyId: key.id });
        },
      });
    },
    [deleteMutation, t],
  );

  const handleCreated = useCallback(
    (key: string) => {
      setCreatedKey(key);
      setCreateDialogVisible(false);
      utils.apiKey.list.invalidate();
    },
    [utils],
  );

  const statusTemplate = useCallback((row: ApiKey) => {
    const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
    const isActive = row.enabled && !isExpired;
    return (
      <Tag
        value={isActive ? "Active" : "Disabled"}
        severity={isActive ? "success" : "danger"}
      />
    );
  }, []);

  const dateTemplate = useCallback(
    (row: ApiKey, field: "createdAt" | "expiresAt") => {
      const value = row[field];
      if (!value) return "—";
      return new Date(value).toLocaleDateString();
    },
    [],
  );

  const usageTemplate = useCallback((row: ApiKey) => {
    if (!row.rateLimitEnabled) return "—";
    if (!row.rateLimitMax) return `${row.requestCount}`;
    return `${row.requestCount} / ${row.rateLimitMax}`;
  }, []);

  const actionsTemplate = useCallback(
    (row: ApiKey) => {
      return (
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          onClick={() => handleDelete(row)}
          tooltip={t("apiKeys.revoke")}
        />
      );
    },
    [handleDelete, t],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
        <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
        <Skeleton width="100%" height="3rem" borderRadius="0.5rem" />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="mb-4 flex justify-end">
        <Button
          size="small"
          label={t("apiKeys.create")}
          icon="pi pi-plus"
          className="bg-(image:--brand-gradient)"
          onClick={() => setCreateDialogVisible(true)}
        />
      </div>

      {keys.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <i className="pi pi-key mb-3 text-4xl text-zinc-500" />
          <p className="text-zinc-400">{t("apiKeys.noKeys")}</p>
        </div>
      ) : (
        <DataTable value={keys} stripedRows>
          <Column field="name" header={t("apiKeys.name")} />
          <Column field="start" header={t("apiKeys.keyPrefix")} />
          <Column
            field="enabled"
            header={t("apiKeys.status")}
            body={statusTemplate}
          />
          <Column
            field="requestCount"
            header={t("apiKeys.usage")}
            body={usageTemplate}
          />
          <Column
            field="createdAt"
            header={t("apiKeys.created")}
            body={(row) => dateTemplate(row, "createdAt")}
          />
          <Column
            field="expiresAt"
            header={t("apiKeys.expires")}
            body={(row) => dateTemplate(row, "expiresAt")}
          />
          <Column
            body={actionsTemplate}
            exportable={false}
            style={{ width: "5rem" }}
          />
        </DataTable>
      )}

      <ApiKeyFormContainer
        visible={createDialogVisible}
        onHide={() => setCreateDialogVisible(false)}
        onCreated={handleCreated}
      />

      <ApiKeyCreatedModal
        apiKey={createdKey}
        onHide={() => setCreatedKey(null)}
      />
    </>
  );
}

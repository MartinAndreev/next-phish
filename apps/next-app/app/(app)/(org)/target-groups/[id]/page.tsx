"use client";

import { useParams } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useState } from "react";
import type { TargetGroupUserView } from "@next-phish/shared";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
} from "@/src/components/molecules/data-table";
import { useDataTable } from "@/src/hooks/use-data-table";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { ImportUsersDialog } from "@/src/components/organisms/target-groups/import-users-dialog";
import { TargetGroupForm } from "@/src/components/organisms/target-groups/target-group-form";
import { AddUserDialog } from "@/src/components/organisms/target-groups/add-user-dialog";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function TargetGroupDetailPage() {
  const t = useTranslation();
  const params = useParams();
  const groupId = params.id as string;
  const utils = trpc.useUtils();
  const [importOpen, setImportOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);

  const { data: group, isLoading: groupLoading } =
    trpc.targetGroup.getById.useQuery({ id: groupId });

  const { setSearch, setPage, buildQueryInput } = useDataTable();
  const queryInput = buildQueryInput(["email", "firstName", "lastName"]);
  const { data: usersData, isLoading: usersLoading } =
    trpc.targetGroup.getUsers.useQuery({
      targetGroupId: groupId,
      search: queryInput.search,
      limit: queryInput.limit,
      offset: queryInput.offset,
    });

  const removeUserMutation = trpc.targetGroup.removeUser.useMutation({
    onSuccess: () => utils.targetGroup.invalidate(),
  });

  const breadcrumbItems = [
    { label: t("targetGroups.title"), url: "/target-groups" },
    { label: group?.name ?? "..." },
  ];

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;

  const columns: DataTableColumn<TargetGroupUserView>[] = [
    { field: "email", header: t("targetGroups.email"), sortable: true },
    { field: "firstName", header: t("targetGroups.firstName"), sortable: true },
    { field: "lastName", header: t("targetGroups.lastName"), sortable: true },
    {
      field: "position",
      header: t("targetGroups.position"),
      body: (user) => user.position ?? "-",
    },
  ];

  const actions: DataTableAction<TargetGroupUserView>[] = [
    {
      label: t("targetGroups.delete"),
      icon: "pi pi-trash",
      severity: "danger",
      onClick: (user) => {
        confirmDialog({
          message: `Remove ${user.firstName} ${user.lastName} from this group?`,
          header: t("targetGroups.deleteTitle"),
          icon: "pi pi-exclamation-triangle",
          accept: () =>
            removeUserMutation.mutate({ id: user.id, targetGroupId: groupId }),
        });
      },
    },
  ];

  if (groupLoading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-48 rounded bg-zinc-700" />
          <div className="mb-2 h-8 w-64 rounded bg-zinc-700" />
          <div className="h-4 w-96 rounded bg-zinc-700" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-6 py-8">
        <p className="text-zinc-400">{t("targetGroups.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {t("targetGroups.editGroup")}
        </h1>
      </div>

      <div className="mb-8 rounded-xl border border-[#1C2945] bg-brand-dark p-6">
        <TargetGroupForm
          mode="edit"
          groupId={groupId}
          initialName={group.name}
          initialStatus={group.status}
          onSuccess={() => utils.targetGroup.invalidate()}
        />
      </div>

      <div className="rounded-xl border border-[#1C2945] bg-brand-dark p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">
            {t("targetGroups.users")} ({total})
          </h2>
          <div className="flex gap-3">
            <Button
              type="button"
              size="small"
              label={t("targetGroups.addUser")}
              icon="pi pi-user-plus"
              severity="secondary"
              onClick={() => setAddUserOpen(true)}
            />
            <Button
              type="button"
              size="small"
              label={t("targetGroups.importUsers")}
              icon="pi pi-upload"
              severity="secondary"
              onClick={() => setImportOpen(true)}
            />
          </div>
        </div>

        <AppDataTable
          data={users}
          total={total}
          columns={columns}
          dataKey="id"
          loading={usersLoading}
          searchPlaceholder={t("targetGroups.searchUsers")}
          actions={actions}
          onSearch={setSearch}
          onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
        />
      </div>

      <ConfirmDialog
        className="max-w-md"
        draggable={false}
        dismissableMask={true}
      />

      <ImportUsersDialog
        visible={importOpen}
        onHide={() => setImportOpen(false)}
        targetGroupId={groupId}
      />

      <AddUserDialog
        visible={addUserOpen}
        onHide={() => setAddUserOpen(false)}
        targetGroupId={groupId}
      />
    </div>
  );
}

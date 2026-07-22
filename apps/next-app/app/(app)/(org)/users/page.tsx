"use client";

import { useState } from "react";
import { BreadCrumb } from "primereact/breadcrumb";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { AppDataTable } from "@/src/components/molecules/data-table";
import type {
  DataTableAction,
  DataTableColumn,
  DataTableFilter,
} from "@/src/components/molecules/data-table";
import { CreateUserContainer } from "@/src/components/organisms/users/create-user-container";
import { DeleteUserDialog } from "@/src/components/organisms/users/delete-user-dialog";
import { useDataTable } from "@/src/hooks/use-data-table";
import { trpc } from "@/src/lib/trpc";
import type { UserView } from "@next-phish/backend";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };
const userFilters: DataTableFilter[] = [
  {
    field: "role",
    label: "System role",
    type: "select",
    options: [
      { label: "Administrator", value: "admin" },
      { label: "Member", value: "user" },
    ],
  },
  {
    field: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Password pending", value: "pending" },
      { label: "Deactivated", value: "disabled" },
    ],
  },
];

export default function UsersPage() {
  const [createVisible, setCreateVisible] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserView | null>(null);
  const utils = trpc.useUtils();
  const { setSearch, setSorts, setFilterValues, setPage, buildQueryInput } =
    useDataTable();
  const input = buildQueryInput(["name", "email", "role", "createdAt"]);
  const usersQuery = trpc.user.list.useQuery(input);
  const setDisabled = trpc.user.setDisabled.useMutation({
    onSuccess: () => utils.user.list.invalidate(),
  });

  const columns: DataTableColumn<UserView>[] = [
    { field: "name", header: "Name", sortable: true },
    { field: "email", header: "Email", sortable: true },
    {
      field: "role",
      header: "System role",
      sortable: true,
      body: (user) => (
        <Badge
          value={user.role === "admin" ? "Administrator" : "Member"}
          severity={user.role === "admin" ? "info" : "secondary"}
        />
      ),
    },
    {
      field: "organizations",
      header: "Organizations",
      body: (user) =>
        user.organizations.length ? (
          <div className="flex max-w-lg flex-wrap gap-1.5">
            {user.organizations.map((org) => (
              <span
                key={org.id}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200"
              >
                {org.name} · {org.role}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-zinc-500">Will create their own</span>
        ),
    },
    {
      field: "disabledAt",
      header: "Status",
      body: (user) =>
        user.disabledAt ? (
          <Badge value="Deactivated" severity="danger" />
        ) : user.passwordSetupRequired ? (
          <Badge value="Password pending" severity="warning" />
        ) : (
          <Badge value="Active" severity="success" />
        ),
    },
    {
      field: "createdAt",
      header: "Created",
      sortable: true,
      body: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  function toggleDisabled(user: UserView) {
    const disabling = !user.disabledAt;
    confirmDialog({
      header: disabling ? "Deactivate user?" : "Reactivate user?",
      message: disabling
        ? `${user.name} will be signed out and unable to access the application. Their data is retained.`
        : `${user.name} will be allowed to sign in again.`,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: disabling ? "Deactivate" : "Reactivate",
      accept: () =>
        setDisabled.mutate({ userId: user.id, disabled: disabling }),
    });
  }

  const actions: DataTableAction<UserView>[] = [
    {
      label: "Deactivate / reactivate",
      icon: "pi pi-ban",
      onClick: toggleDisabled,
    },
    {
      label: "Delete permanently",
      icon: "pi pi-trash",
      severity: "danger",
      onClick: setDeleteUser,
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <BreadCrumb home={breadcrumbHome} model={[{ label: "Users" }]} />
          <h1 className="mt-2 text-2xl font-semibold text-white">
            User administration
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage every system user, their role, organizations, access, and
            account lifecycle.
          </p>
        </div>
        <Button
          size="small"
          label="Create user"
          icon="pi pi-plus"
          onClick={() => setCreateVisible(true)}
        />
      </div>

      <AppDataTable
        data={usersQuery.data?.users ?? []}
        total={usersQuery.data?.total ?? 0}
        columns={columns}
        dataKey="id"
        loading={usersQuery.isLoading}
        searchPlaceholder="Search users by name or email"
        filters={userFilters}
        actions={actions}
        onSearch={setSearch}
        onSort={setSorts}
        onFilter={setFilterValues}
        onPage={(offset, limit) => setPage({ offset: offset * limit, limit })}
      />

      <Dialog
        visible={createVisible}
        onHide={() => setCreateVisible(false)}
        header="Create user"
        modal
        draggable={false}
        className="w-[min(46rem,calc(100vw-2rem))]"
      >
        <CreateUserContainer
          onCreated={() => setCreateVisible(false)}
          onCancel={() => setCreateVisible(false)}
        />
      </Dialog>
      <DeleteUserDialog user={deleteUser} onClose={() => setDeleteUser(null)} />
      <ConfirmDialog draggable={false} />
    </div>
  );
}

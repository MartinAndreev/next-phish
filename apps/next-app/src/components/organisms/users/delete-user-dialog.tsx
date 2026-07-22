"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import { Message } from "primereact/message";
import type { UserView } from "@next-phish/backend";
import { trpc } from "@/src/lib/trpc";

export function DeleteUserDialog({
  user,
  onClose,
}: {
  user: UserView | null;
  onClose: () => void;
}) {
  const [orphanAction, setOrphanAction] = useState<"keep" | "delete">("keep");
  const utils = trpc.useUtils();
  const preview = trpc.user.deletionPreview.useQuery(
    { userId: user?.id ?? "" },
    { enabled: Boolean(user) },
  );
  const remove = trpc.user.delete.useMutation({
    onSuccess: async () => {
      await utils.user.list.invalidate();
      onClose();
    },
  });

  const data = preview.data;
  return (
    <Dialog
      visible={Boolean(user)}
      onHide={onClose}
      header={`Delete ${user?.name ?? "user"}?`}
      modal
      className="w-[min(42rem,calc(100vw-2rem))]"
      draggable={false}
    >
      <div className="space-y-5 text-sm text-zinc-300">
        <Message
          severity="error"
          text="This permanently deletes the user and cannot be undone."
          className="w-full"
        />
        {preview.isLoading ? (
          <p>Checking active data…</p>
        ) : (
          <>
            {data?.ownedOrganizations.length ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                <p className="font-semibold text-red-100">
                  This user owns active organization data.
                </p>
                <p className="mt-1">
                  The following organizations and all of their campaigns,
                  templates, pages, schedules, files, and other data will be
                  deleted:
                </p>
                <ul className="mt-2 list-inside list-disc text-red-100">
                  {data.ownedOrganizations.map((org) => (
                    <li key={org.id}>{org.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>
                The user will be removed from every organization. Data they
                authored in surviving organizations will be reassigned to
                another organization owner or administrator.
              </p>
            )}

            {data?.orphanedUsers.length ? (
              <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
                <legend className="px-1 font-semibold text-white">
                  {data.orphanedUsers.length} other user(s) only belong to
                  organizations being deleted
                </legend>
                <label className="flex cursor-pointer gap-3">
                  <RadioButton
                    checked={orphanAction === "keep"}
                    onChange={() => setOrphanAction("keep")}
                  />
                  <span>
                    <strong className="block text-white">
                      Keep these users
                    </strong>
                    They will be asked to create their own organization on their
                    next login.
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3">
                  <RadioButton
                    checked={orphanAction === "delete"}
                    onChange={() => setOrphanAction("delete")}
                  />
                  <span>
                    <strong className="block text-white">
                      Delete these users too
                    </strong>
                    Their accounts will also be permanently deleted.
                  </span>
                </label>
                <ul className="pl-8 text-xs text-zinc-400">
                  {data.orphanedUsers.map((orphan) => (
                    <li key={orphan.id}>
                      {orphan.name} — {orphan.email}
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}
          </>
        )}
        {remove.error && (
          <Message
            severity="error"
            text={remove.error.message}
            className="w-full"
          />
        )}
        <div className="flex justify-end gap-3">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            onClick={onClose}
          />
          <Button
            label="Delete permanently"
            severity="danger"
            icon="pi pi-trash"
            loading={remove.isPending}
            disabled={!data || preview.isLoading}
            onClick={() =>
              user && remove.mutate({ userId: user.id, orphanAction })
            }
          />
        </div>
      </div>
    </Dialog>
  );
}

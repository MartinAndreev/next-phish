"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { CreateOrgForm } from "./create-org-form";
import { useMyOrganizations } from "@/src/hooks/use-my-organizations";

interface CreateOrgModalProps {
  visible: boolean;
  onHide: () => void;
}

export function CreateOrgModal({ visible, onHide }: CreateOrgModalProps) {
  const { create, setActive } = useMyOrganizations();
  const [error, setError] = useState("");

  async function handleSubmit(values: { name: string; slug: string }) {
    setError("");

    create.mutate(values, {
      onSuccess: async (org) => {
        if (org && "id" in org) {
          await setActive(org.id as string);
        }
        onHide();
      },
      onError: (err) => {
        setError(err.message || "Failed to create organization.");
      },
    });
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Create organization"
      className="w-full max-w-md"
      draggable={false}
      pt={{
        header: { className: "bg-brand-dark border-b border-white/10 p-4" },
        content: { className: "bg-brand-dark" },
        footer: { className: "bg-brand-dark border-t border-white/10" },
      }}
    >
      <CreateOrgForm
        error={error}
        isSubmitting={create.isPending}
        onSubmit={handleSubmit}
        onCancel={onHide}
      />
    </Dialog>
  );
}

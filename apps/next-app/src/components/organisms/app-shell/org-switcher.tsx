"use client";

import { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useMyOrganizations } from "@/src/hooks/use-my-organizations";
import { CreateOrgModal } from "./create-org-modal";
import { selectSmallDark } from "@/src/components/ui/theme-constants";
import { useTranslation } from "@/src/lib/i18n";

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const t = useTranslation();
  const { organizations, activeOrg, setActive, isLoading } =
    useMyOrganizations();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = organizations.some((org) => org.$me.role === "owner");

  const selectedOrg = organizations.find((org) => org.id === activeOrg?.id);

  if (collapsed) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="h-8 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <Dropdown
          value={selectedOrg}
          options={organizations}
          optionLabel="name"
          placeholder={t("nav.selectOrganization")}
          onChange={(e) => {
            if (e.value) {
              setActive(e.value.id);
            }
          }}
          className="flex-1"
          pt={selectSmallDark}
          valueTemplate={(option) => {
            if (!option)
              return (
                <span className="text-xs text-zinc-400">
                  {t("nav.selectOrganization")}
                </span>
              );
            return (
              <div className="flex items-center gap-2">
                <i className="pi pi-building text-xs text-zinc-400" />
                <span className="truncate text-xs">{option.name}</span>
              </div>
            );
          }}
          itemTemplate={(option) => (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="pi pi-building text-xs text-zinc-400" />
                <span>{option.name}</span>
              </div>
              {option.$me.role === "owner" && (
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  {t("organizations.ownerBadge")}
                </span>
              )}
            </div>
          )}
        />
        {canCreate && (
          <Button
            size="small"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            icon="pi pi-plus text-xs"
            tooltip={t("nav.newOrganization")}
            tooltipOptions={{ position: "top" }}
            onClick={() => setShowCreateModal(true)}
          />
        )}
      </div>

      <CreateOrgModal
        visible={showCreateModal}
        onHide={() => setShowCreateModal(false)}
      />
    </>
  );
}

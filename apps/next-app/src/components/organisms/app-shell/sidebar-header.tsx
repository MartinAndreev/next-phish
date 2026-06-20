"use client";

import Image from "next/image";
import { useTranslation } from "@/src/lib/i18n";

interface SidebarHeaderProps {
  collapsed?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}

export function SidebarHeader({
  collapsed,
  onExpand,
  onClose,
}: SidebarHeaderProps) {
  const t = useTranslation();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-b border-white/10 py-3">
        <Image
          src="/images/logo/logo-icon-only.png"
          alt="NextPhish"
          width={28}
          height={28}
          priority
        />
        <button
          type="button"
          onClick={onExpand}
          aria-label={t("nav.expandSidebar")}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          title={t("nav.expandSidebar")}
        >
          <i className="pi pi-chevron-right text-xs" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-3">
        <Image
          src="/images/logo/logo-icon-only.png"
          alt="NextPhish"
          width={32}
          height={32}
          priority
        />
        <span className="text-lg font-semibold text-white">NextPhish</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("nav.collapseSidebar")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          title={t("nav.collapseSidebar")}
        >
          <i className="pi pi-chevron-left text-base" />
        </button>
      )}
    </div>
  );
}

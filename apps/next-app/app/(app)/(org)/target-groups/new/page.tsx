"use client";

import { BreadCrumb } from "primereact/breadcrumb";
import { useTranslation } from "@/src/lib/i18n";
import { TargetGroupForm } from "@/src/components/organisms/target-groups/target-group-form";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function NewTargetGroupPage() {
  const t = useTranslation();

  const breadcrumbItems = [
    {
      label: t("targetGroups.title"),
      url: "/target-groups",
    },
    { label: t("targetGroups.createTitle") },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {t("targetGroups.createTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("targetGroups.createSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-[#1C2945] bg-brand-dark p-6">
        <TargetGroupForm />
      </div>
    </div>
  );
}

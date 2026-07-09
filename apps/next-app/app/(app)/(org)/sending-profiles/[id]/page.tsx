"use client";

import { useParams } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { FormSkeleton } from "@/src/components/atoms/form-skeleton";
import { SendingProfileFormContainer } from "@/src/components/organisms/sending-profiles";

const breadcrumbHome = { icon: "pi pi-home", url: "/" };

export default function EditSendingProfilePage() {
  const t = useTranslation();
  const params = useParams();
  const profileId = params.id as string;

  const { data: profile, isLoading } = trpc.mailSending.getById.useQuery({
    id: profileId,
  });

  if (isLoading) {
    return <FormSkeleton editorHeight="480px" />;
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <p className="text-zinc-400">{t("sendingProfiles.notFound")}</p>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: t("sendingProfiles.title"),
      url: "/sending-profiles",
    },
    { label: profile.name },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} />
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {t("sendingProfiles.editProfile")}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {t("sendingProfiles.editSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-[#1C2945] bg-brand-dark p-6">
        <SendingProfileFormContainer profileId={profileId} />
      </div>
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import EmailTemplateFormContainer from "@/src/components/organisms/email-templates";

export default function EmailTemplateEditorPage() {
  const params = useParams();

  return <EmailTemplateFormContainer templateId={params.id as string} />;
}

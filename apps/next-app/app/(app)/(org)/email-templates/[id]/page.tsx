"use client";

import { useParams } from "next/navigation";
import { EmailTemplateEditorForm } from "@/src/components/organisms/email-templates/email-template-editor-form";

export default function EmailTemplateEditorPage() {
  const params = useParams();

  return <EmailTemplateEditorForm templateId={params.id as string} />;
}

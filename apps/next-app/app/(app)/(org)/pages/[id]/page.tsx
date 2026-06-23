"use client";

import { useParams } from "next/navigation";
import PageFormContainer from "@/src/components/organisms/pages";

export default function PageEditorPage() {
  const params = useParams();

  return <PageFormContainer pageId={params.id as string} />;
}

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "primereact/skeleton";
import type { Editor } from "grapesjs";

const GrapesEditor = dynamic(
  () =>
    import("@/src/components/organisms/grapes-editor/grapes-editor").then(
      (module) => module.GrapesEditor,
    ),
  {
    ssr: false,
    loading: () => <Skeleton width="100%" height="720px" borderRadius="1rem" />,
  },
);

interface PageEditorSectionProps {
  pageId?: string;
  initialDesign?: unknown;
  editorHtmlRef: React.MutableRefObject<string>;
  editorDesignRef: React.MutableRefObject<unknown>;
  onEditorRef: (editor: Editor) => void;
  t: (key: string) => string;
}

export function PageEditorSection({
  pageId,
  initialDesign,
  editorHtmlRef,
  editorDesignRef,
  onEditorRef,
  t,
}: PageEditorSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {t("pages.editorLabel")}
        </h2>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          GrapesJS
        </span>
      </div>
      <GrapesEditor
        mode="page"
        key={pageId ?? "new"}
        initialDesign={initialDesign}
        onEditor={onEditorRef}
        onChange={({ html, design }) => {
          editorHtmlRef.current = html;
          editorDesignRef.current = design;
        }}
      />
    </section>
  );
}

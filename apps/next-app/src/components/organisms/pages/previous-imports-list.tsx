"use client";

import { useState } from "react";
import { InputText } from "primereact/inputtext";

interface PreviousImport {
  id: string;
  url: string;
  finalUrl: string | null;
  status: string;
  includeAssets: boolean;
  html: string | null;
  assetDownloaded: number;
  fileCount: number;
  createdAt: Date;
}

interface PreviousImportsListProps {
  imports: PreviousImport[];
  t: (key: string) => string;
  onSelect: (imp: PreviousImport) => void;
  onSearch: (query: string) => void;
}

export function PreviousImportsList({
  imports,
  t,
  onSelect,
  onSearch,
}: PreviousImportsListProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  if (imports.length === 0) return null;

  function handleSearchChange(value: string) {
    setSearch(value);
    onSearch(value);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <i
          className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} text-xs`}
        />
        {t("pages.previousImports")} ({imports.length})
      </button>

      {expanded && (
        <div className="space-y-2">
          <InputText
            size="small"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by URL or domain..."
            className="w-full rounded-lg border border-white/10 bg-white/95 text-slate-900 text-sm"
          />

          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
            {imports.map((imp) => (
              <button
                key={imp.id}
                type="button"
                onClick={() => onSelect(imp)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-zinc-200">
                    {imp.finalUrl || imp.url}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {imp.includeAssets ? `${imp.fileCount} files` : "HTML only"}
                    {" · "}
                    {new Date(imp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <i className="pi pi-check-circle ml-2 text-xs text-green-400" />
              </button>
            ))}

            {imports.length === 0 && search && (
              <p className="px-3 py-2 text-xs text-zinc-500">
                No imports matching &quot;{search}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

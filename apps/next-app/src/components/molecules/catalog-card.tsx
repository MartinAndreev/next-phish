"use client";

import Image from "next/image";
import { memo } from "react";

interface CatalogCardProps {
  id: string;
  name: string;
  selected: boolean;
  status?: string;
  html?: string;
  preview?: { status: string; url: string | null } | null;
  onSelect: (id: string) => void;
}

function CatalogCardComponent({
  id,
  name,
  selected,
  status,
  html,
  preview,
  onSelect,
}: CatalogCardProps) {
  const selectedClass = selected
    ? "border-brand-blue ring-2 ring-brand-blue/30"
    : "border-white/10 hover:border-brand-blue/50";

  return (
    <article
      className={`w-full overflow-hidden rounded-xl border bg-brand-navy/40 text-left shadow-[0_12px_28px_rgba(2,11,29,0.2)] transition ${selectedClass}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-white">
        {preview?.status === "READY" && preview.url ? (
          <Image
            src={preview.url}
            alt={`Preview of ${name}`}
            fill
            sizes="(min-width: 1280px) 28vw, (min-width: 640px) 45vw, 90vw"
            unoptimized
            className="object-cover object-top"
          />
        ) : html ? (
          <iframe
            title={`Preview of ${name}`}
            srcDoc={html}
            sandbox=""
            referrerPolicy="no-referrer"
            scrolling="no"
            tabIndex={-1}
            className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-navy/60 text-zinc-500">
            <i className="pi pi-image text-3xl" aria-hidden="true" />
            <span className="sr-only">Preview unavailable</span>
          </div>
        )}
        <button
          type="button"
          aria-label={`Select ${name}`}
          aria-pressed={selected}
          onClick={() => onSelect(id)}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      </div>

      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(id)}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-white">
            {name}
          </span>
          {status && status !== "ACTIVE" ? (
            <span className="mt-1 block text-xs text-amber-300">
              {status.toLowerCase()}
            </span>
          ) : null}
        </span>
        {selected ? (
          <i
            className="pi pi-check-circle text-brand-cyan"
            aria-hidden="true"
          />
        ) : null}
      </button>
    </article>
  );
}

export const CatalogCard = memo(CatalogCardComponent);

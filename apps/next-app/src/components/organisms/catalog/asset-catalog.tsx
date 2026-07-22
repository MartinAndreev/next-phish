"use client";

import { InputText } from "primereact/inputtext";
import { Paginator } from "primereact/paginator";
import { Skeleton } from "primereact/skeleton";
import type { CatalogPreviewView } from "@next-phish/shared";
import { CatalogCard } from "@/src/components/molecules/catalog-card";

interface CatalogItem {
  id: string;
  name: string;
  status: string;
  html?: string;
  preview: CatalogPreviewView | null;
}

interface AssetCatalogTabProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  items: CatalogItem[];
  total: number;
  loading: boolean;
  selectedId: string;
  search: string;
  offset: number;
  limit: number;
  onSearch: (value: string) => void;
  onPage: (offset: number, limit: number) => void;
  onSelect: (id: string) => void;
}

export function AssetCatalogTab({
  title,
  description,
  searchPlaceholder,
  emptyMessage,
  items,
  total,
  loading,
  selectedId,
  search,
  offset,
  limit,
  onSearch,
  onPage,
  onSelect,
}: AssetCatalogTabProps) {
  return (
    <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5 shadow-[0_20px_45px_rgba(2,11,29,0.28)]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <i className="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-zinc-400" />
          <InputText
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            pt={{
              root: {
                className: "w-full py-2 pl-9 pr-3 text-xs",
              },
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: limit }, (_, index) => (
            <Skeleton key={index} height="13rem" borderRadius="1rem" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CatalogCard
              key={item.id}
              {...item}
              selected={selectedId === item.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-zinc-400">
          {emptyMessage}
        </div>
      )}

      {total > limit ? (
        <Paginator
          first={offset}
          rows={limit}
          totalRecords={total}
          rowsPerPageOptions={[6, 12, 24]}
          onPageChange={(event) => onPage(event.first, event.rows)}
          className="mt-5"
        />
      ) : null}
    </section>
  );
}

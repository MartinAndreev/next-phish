"use client";

import { useState } from "react";
import type { DataTableSort } from "@/src/components/molecules/data-table";

interface UseDataTableOptions {
  defaultRows?: number;
}

export function useDataTable(options?: UseDataTableOptions) {
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<DataTableSort[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState({
    offset: 0,
    limit: options?.defaultRows ?? 10,
  });

  function buildQueryInput<T extends string>(sortFields: T[]) {
    return {
      search: search || undefined,
      limit: page.limit,
      offset: page.offset,
      sort:
        sorts.length > 0
          ? sorts
              .filter((s) => sortFields.includes(s.field as T))
              .map((s) => ({
                field: s.field as T,
                order: s.order,
              }))
          : undefined,
      filters:
        Object.keys(filterValues).length > 0
          ? (filterValues as Record<string, string>)
          : undefined,
    };
  }

  return {
    search,
    setSearch,
    sorts,
    setSorts,
    filterValues,
    setFilterValues,
    page,
    setPage,
    buildQueryInput,
  };
}

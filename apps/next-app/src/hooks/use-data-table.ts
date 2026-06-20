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
    const normalizedFilters = Object.entries(filterValues).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      if (typeof value === "string" && value) {
        acc[key] = value;
      }

      return acc;
    }, {});

    const sort =
      sorts.length > 0
        ? sorts.reduce<Array<{ field: T; order: DataTableSort["order"] }>>(
            (acc, currentSort) => {
              if (sortFields.includes(currentSort.field as T)) {
                acc.push({
                  field: currentSort.field as T,
                  order: currentSort.order,
                });
              }

              return acc;
            },
            [],
          )
        : undefined;

    return {
      search: search || undefined,
      limit: page.limit,
      offset: page.offset,
      sort: sort && sort.length > 0 ? sort : undefined,
      filters:
        Object.keys(normalizedFilters).length > 0
          ? normalizedFilters
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

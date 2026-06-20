"use client";

import { useState, useCallback, useRef } from "react";
import { DataTable as PrimeDataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import type {
  DataTablePageEvent,
  DataTableSortMeta,
} from "primereact/datatable";
import type { AppDataTableProps, DataTableSort } from "./types";
import { FilterBar } from "./filter-bar";
import { ActionColumn } from "./action-column";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AppDataTable<T extends Record<string, any>>({
  data,
  total,
  columns,
  dataKey,
  loading = false,
  searchPlaceholder = "Search...",
  filters,
  actions,
  onSearch,
  onSort,
  onFilter,
  onPage,
  defaultRows = 10,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
}: AppDataTableProps<T>) {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(defaultRows);
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<DataTableSort[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onSearch?.(value);
        setFirst(0);
        onPage?.(0, rows);
      }, 300);
    },
    [onSearch, onPage, rows],
  );

  const handleSort = useCallback(
    (e: { multiSortMeta?: DataTableSortMeta[] | null }) => {
      if (!onSort) return;
      const newSorts = (e.multiSortMeta ?? []).map((meta) => ({
        field: meta.field as string,
        order: meta.order === 1 ? ("asc" as const) : ("desc" as const),
      }));
      setSorts(newSorts);
      onSort(newSorts);
    },
    [onSort],
  );

  const handlePage = useCallback(
    (e: DataTablePageEvent) => {
      setFirst(e.first);
      setRows(e.rows);
      onPage?.(e.first / e.rows, e.rows);
    },
    [onPage],
  );

  const handleFilterChange = useCallback(
    (field: string, value: unknown) => {
      const newFilters = { ...filterValues, [field]: value };
      setFilterValues(newFilters);
      onFilter?.(newFilters);
      setFirst(0);
      onPage?.(0, rows);
    },
    [filterValues, onFilter, onPage, rows],
  );

  const multiSortMeta: DataTableSortMeta[] = sorts.map((s) => ({
    field: s.field,
    order: s.order === "asc" ? 1 : -1,
  }));

  const header = (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
        <InputText
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={searchPlaceholder}
          pt={{
            root: {
              className:
                "w-full rounded-lg border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 text-xs py-2 pl-9 pr-3",
            },
          }}
        />
      </div>
      {filters && filters.length > 0 && (
        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
        />
      )}
    </div>
  );

  return (
    <PrimeDataTable
      value={data}
      lazy
      paginator
      first={first}
      rows={rows}
      totalRecords={total}
      rowsPerPageOptions={rowsPerPageOptions}
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
      onPage={handlePage}
      sortMode="multiple"
      multiSortMeta={multiSortMeta}
      onSort={handleSort}
      removableSort
      loading={loading}
      showGridlines
      header={header}
      emptyMessage="No records found."
      size="normal"
      dataKey={dataKey as string}
      tableStyle={{ minWidth: "50rem" }}
    >
      {columns.map((col) => (
        <Column
          key={col.field}
          field={col.field}
          header={col.header}
          sortable={col.sortable}
          body={col.body}
          style={col.style}
        />
      ))}
      {actions && actions.length > 0 && (
        <Column
          header=""
          body={(row: T) => <ActionColumn row={row} actions={actions} />}
          style={{ width: "4rem" }}
        />
      )}
    </PrimeDataTable>
  );
}

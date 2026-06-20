"use client";

import { DataTable as PrimeDataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import type { AppDataTableProps } from "./types";
import { FilterBar } from "./filter-bar";
import { ActionColumn } from "./action-column";
import { useTableState } from "@/src/hooks/use-table-state";
import { useTranslation } from "@/src/lib/i18n";

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
  const t = useTranslation();
  const { state, setSearch, setSorts, setPage, setFilter, multiSortMeta } =
    useTableState({ defaultRows, onSearch, onSort, onFilter, onPage });

  const header = (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm" />
        <InputText
          value={state.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          pt={{
            root: {
              className: "w-full text-xs py-2 pl-9 pr-3",
            },
          }}
        />
      </div>
      {filters && filters.length > 0 && (
        <FilterBar
          filters={filters}
          values={state.filterValues}
          onChange={setFilter}
        />
      )}
    </div>
  );

  return (
    <PrimeDataTable
      value={data}
      lazy
      paginator
      first={state.first}
      rows={state.rows}
      totalRecords={total}
      rowsPerPageOptions={rowsPerPageOptions}
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      currentPageReportTemplate={t("common.currentPageReport")}
      onPage={setPage}
      sortMode="multiple"
      multiSortMeta={multiSortMeta}
      onSort={setSorts}
      removableSort
      loading={loading}
      showGridlines
      header={header}
      emptyMessage={t("common.noRecordsFound")}
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

"use client";

import { useReducer, useCallback, useRef } from "react";
import type { DataTableSortMeta } from "primereact/datatable";
import type { DataTableSort } from "@/src/components/molecules/data-table";

interface TableState {
  first: number;
  rows: number;
  search: string;
  sorts: DataTableSort[];
  filterValues: Record<string, unknown>;
}

type TableAction =
  | { type: "SET_PAGE"; first: number; rows: number }
  | { type: "SET_SEARCH"; search: string }
  | { type: "SET_SORTS"; sorts: DataTableSort[] }
  | { type: "SET_FILTERS"; filterValues: Record<string, unknown> }
  | { type: "RESET_PAGE" };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, first: action.first, rows: action.rows };
    case "SET_SEARCH":
      return { ...state, search: action.search };
    case "SET_SORTS":
      return { ...state, sorts: action.sorts };
    case "SET_FILTERS":
      return { ...state, filterValues: action.filterValues };
    case "RESET_PAGE":
      return { ...state, first: 0 };
    default:
      return state;
  }
}

interface UseTableStateOptions {
  defaultRows?: number;
  onSearch?: (query: string) => void;
  onSort?: (sorts: DataTableSort[]) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onPage?: (page: number, rows: number) => void;
}

export function useTableState(options: UseTableStateOptions = {}) {
  const { defaultRows = 10, onSearch, onSort, onFilter, onPage } = options;

  const [state, dispatch] = useReducer(tableReducer, {
    first: 0,
    rows: defaultRows,
    search: "",
    sorts: [],
    filterValues: {},
  });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearch = useCallback(
    (value: string) => {
      dispatch({ type: "SET_SEARCH", search: value });
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onSearch?.(value);
        dispatch({ type: "RESET_PAGE" });
        onPage?.(0, state.rows);
      }, 300);
    },
    [onSearch, onPage, state.rows],
  );

  const setSorts = useCallback(
    (e: { multiSortMeta?: DataTableSortMeta[] | null }) => {
      if (!onSort) return;
      const newSorts = (e.multiSortMeta ?? []).map((meta) => ({
        field: meta.field as string,
        order: meta.order === 1 ? ("asc" as const) : ("desc" as const),
      }));
      dispatch({ type: "SET_SORTS", sorts: newSorts });
      onSort(newSorts);
    },
    [onSort],
  );

  const setPage = useCallback(
    (e: { first: number; rows: number }) => {
      dispatch({ type: "SET_PAGE", first: e.first, rows: e.rows });
      onPage?.(e.first / e.rows, e.rows);
    },
    [onPage],
  );

  const setFilter = useCallback(
    (field: string, value: unknown) => {
      const newFilters = { ...state.filterValues, [field]: value };
      dispatch({ type: "SET_FILTERS", filterValues: newFilters });
      onFilter?.(newFilters);
      dispatch({ type: "RESET_PAGE" });
      onPage?.(0, state.rows);
    },
    [state.filterValues, onFilter, onPage, state.rows],
  );

  const multiSortMeta: DataTableSortMeta[] = state.sorts.map((s) => ({
    field: s.field,
    order: s.order === "asc" ? 1 : -1,
  }));

  return {
    state,
    setSearch,
    setSorts,
    setPage,
    setFilter,
    multiSortMeta,
  };
}

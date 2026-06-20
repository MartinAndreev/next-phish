import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  field: keyof T & string;
  header: string;
  sortable?: boolean;
  body?: (row: T) => ReactNode;
  style?: React.CSSProperties;
}

export interface DataTableAction<T> {
  label: string;
  icon: string;
  onClick: (row: T) => void;
  visible?: (row: T) => boolean;
  severity?: "danger" | "default";
}

export interface DataTableFilter {
  field: string;
  label: string;
  type: "text" | "select" | "date" | "numeric";
  options?: { label: string; value: string }[];
}

export interface DataTableSort {
  field: string;
  order: "asc" | "desc";
}

export interface AppDataTableProps<T> {
  data: T[];
  total: number;
  columns: DataTableColumn<T>[];
  dataKey: keyof T & string;
  loading?: boolean;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  actions?: DataTableAction<T>[];
  onSearch?: (query: string) => void;
  onSort?: (sorts: DataTableSort[]) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onPage?: (page: number, rows: number) => void;
  defaultRows?: number;
  rowsPerPageOptions?: number[];
}

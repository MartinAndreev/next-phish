import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  field: keyof T & string;
  header: string;
  sortable?: boolean;
  body?: (row: T) => ReactNode;
  style?: React.CSSProperties;
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
  onSearch?: (query: string) => void;
  onSort?: (sorts: DataTableSort[]) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onPage?: (page: number, rows: number) => void;
  defaultRows?: number;
  rowsPerPageOptions?: number[];
}

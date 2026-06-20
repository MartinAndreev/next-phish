"use client";

import type { DataTableFilter } from "./types";
import { TextFilter } from "./filters/text-filter";
import { SelectFilter } from "./filters/select-filter";
import { DateFilter } from "./filters/date-filter";
import { NumericFilter } from "./filters/numeric-filter";

interface FilterBarProps {
  filters: DataTableFilter[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        switch (filter.type) {
          case "text":
            return (
              <TextFilter
                key={filter.field}
                field={filter.field}
                label={filter.label}
                value={(values[filter.field] as string) ?? ""}
                onChange={onChange}
              />
            );
          case "select":
            return (
              <SelectFilter
                key={filter.field}
                field={filter.field}
                label={filter.label}
                value={(values[filter.field] as string) ?? ""}
                options={filter.options ?? []}
                onChange={onChange}
              />
            );
          case "date":
            return (
              <DateFilter
                key={filter.field}
                field={filter.field}
                label={filter.label}
                value={(values[filter.field] as Date) ?? null}
                onChange={onChange}
              />
            );
          case "numeric":
            return (
              <NumericFilter
                key={filter.field}
                field={filter.field}
                label={filter.label}
                value={(values[filter.field] as number) ?? null}
                onChange={onChange}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

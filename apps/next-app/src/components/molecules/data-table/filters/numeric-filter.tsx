"use client";

import { InputNumber } from "primereact/inputnumber";

interface NumericFilterProps {
  field: string;
  label: string;
  value: number | null;
  onChange: (field: string, value: number | null) => void;
}

export function NumericFilter({
  field,
  label,
  value,
  onChange,
}: NumericFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`filter-${field}`}
        className="text-xs font-medium text-zinc-400"
      >
        {label}
      </label>
      <InputNumber
        id={`filter-${field}`}
        value={value}
        onChange={(e) => onChange(field, e.value)}
        placeholder={`Filter by ${label.toLowerCase()}`}
        className="w-40"
        pt={{
          root: {
            className:
              "bg-brand-dark border border-white/10 rounded-lg text-white/80",
          },
          input: {
            root: {
              className:
                "text-white/80 text-xs py-1.5 px-2 bg-transparent w-full",
            },
          },
        }}
      />
    </div>
  );
}

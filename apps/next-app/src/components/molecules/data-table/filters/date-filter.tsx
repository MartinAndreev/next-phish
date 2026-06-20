"use client";

import { Calendar } from "primereact/calendar";

interface DateFilterProps {
  field: string;
  label: string;
  value: Date | null;
  onChange: (field: string, value: Date | null) => void;
}

export function DateFilter({ field, label, value, onChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`filter-${field}`}
        className="text-xs font-medium text-zinc-400"
      >
        {label}
      </label>
      <Calendar
        id={`filter-${field}`}
        value={value}
        onChange={(e) => onChange(field, e.value as Date | null)}
        placeholder={`Select ${label.toLowerCase()}`}
        className="w-40"
        pt={{
          root: {
            className:
              "bg-brand-dark border border-white/10 rounded-lg text-white/80",
          },
          input: {
            className:
              "text-white/80 text-xs py-1.5 px-2 bg-transparent w-full",
          },
          panel: {
            className:
              "bg-brand-dark border border-white/10 rounded-lg shadow-lg",
          },
        }}
      />
    </div>
  );
}

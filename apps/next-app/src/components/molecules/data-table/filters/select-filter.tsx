"use client";

import { Dropdown } from "primereact/dropdown";
import { selectSmall } from "@/src/components/ui/theme-constants";

interface SelectFilterProps {
  field: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (field: string, value: string) => void;
}

export function SelectFilter({
  field,
  label,
  value,
  options,
  onChange,
}: SelectFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`filter-${field}`}
        className="text-xs font-medium text-zinc-400"
      >
        {label}
      </label>
      <Dropdown
        id={`filter-${field}`}
        value={value}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder={`All ${label.toLowerCase()}`}
        onChange={(e) => onChange(field, e.value)}
        showClear={Boolean(value)}
        className="w-40"
        pt={selectSmall}
      />
    </div>
  );
}

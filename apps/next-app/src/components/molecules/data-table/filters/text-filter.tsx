"use client";

import { InputText } from "primereact/inputtext";

interface TextFilterProps {
  field: string;
  label: string;
  value: string;
  onChange: (field: string, value: string) => void;
}

export function TextFilter({ field, label, value, onChange }: TextFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`filter-${field}`}
        className="text-xs font-medium text-zinc-400"
      >
        {label}
      </label>
      <InputText
        id={`filter-${field}`}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 text-xs py-1.5 px-2"
        placeholder={`Filter by ${label.toLowerCase()}`}
      />
    </div>
  );
}

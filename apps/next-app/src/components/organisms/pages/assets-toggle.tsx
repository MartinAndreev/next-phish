"use client";

import { Checkbox } from "primereact/checkbox";

interface AssetsToggleProps {
  checked: boolean;
  t: (key: string) => string;
  onChange: (value: boolean) => void;
}

export function AssetsToggle({ checked, t, onChange }: AssetsToggleProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#1C2945] bg-brand-dark p-3">
      <Checkbox
        inputId="includeAssets"
        checked={checked}
        onChange={(e) => onChange(e.checked ?? false)}
      />
      <div>
        <label
          htmlFor="includeAssets"
          className="block text-sm font-medium text-zinc-100 cursor-pointer"
        >
          {t("pages.includeAssets")}
        </label>
        <p className="mt-1 text-xs text-zinc-400">
          {t("pages.includeAssetsHint")}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { FieldInputProps } from "formik";
import { Field } from "formik";
import { AutoComplete } from "primereact/autocomplete";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { trpc } from "@/src/lib/trpc";
import type { PageListItemView } from "@next-phish/shared";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/95 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] placeholder:text-slate-400 mb-2";

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
] as const;

const typeOptions = [
  { label: "Landing", value: "LANDING" },
  { label: "Redirect", value: "REDIRECT" },
];

const redirectTargetOptions = [
  { label: "No redirect", value: "none" },
  { label: "Internal page", value: "page" },
  { label: "External URL", value: "url" },
];

interface PageSettingsFieldsProps {
  pageId?: string;
  values: {
    type: "LANDING" | "REDIRECT";
    status: "DRAFT" | "ACTIVE";
    captureData: boolean;
    redirectTarget: "none" | "page" | "url";
    redirectUrl: string | null;
  };
  setFieldValue: (
    field: string,
    value: string | boolean | null,
    shouldValidate?: boolean,
  ) => Promise<unknown>;
  t: (key: string) => string;
}

export function PageSettingsFields({
  pageId,
  values,
  setFieldValue,
  t,
}: PageSettingsFieldsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pagesAutocompleteValue, setPagesAutocompleteValue] =
    useState<PageListItemView | null>(null);

  const { data: searchResults } = trpc.page.list.useQuery(
    { search: searchQuery, limit: 10 },
    {
      enabled: searchQuery.length > 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  );

  function handleSearch(event: { query: string }) {
    setSearchQuery(event.query);
  }

  return (
    <div className="flex flex-col gap-3 mb-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-100">
          {t("pages.type")}
        </label>
        <Dropdown
          pt={selectSmall}
          value={values.type}
          options={typeOptions}
          onChange={(e) => setFieldValue("type", e.value)}
          disabled={Boolean(pageId)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-100">
          {t("pages.status")}
        </label>
        <Dropdown
          pt={selectSmall}
          value={values.status}
          options={statusOptions.map((option) => ({
            label:
              option.value === "ACTIVE"
                ? t("common.active")
                : t("common.draft"),
            value: option.value,
          }))}
          onChange={(e) => setFieldValue("status", e.value)}
          className="w-full"
        />
      </div>

      {values.type === "LANDING" && (
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            inputId="captureData"
            checked={values.captureData}
            onChange={(e) => setFieldValue("captureData", e.checked ?? false)}
          />
          <label
            htmlFor="captureData"
            className="text-sm font-medium text-zinc-100 cursor-pointer"
          >
            {t("pages.captureData")}
          </label>
          <i
            className="capture-data-hint pi pi-info-circle cursor-help text-zinc-400"
            data-pr-tooltip={t("pages.captureDataHint")}
          />
        </div>
      )}

      <div className="space-y-2 flex flex-col gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-100">
            {t("pages.redirectTarget")}
          </label>
          <Dropdown
            pt={selectSmall}
            value={values.redirectTarget}
            options={redirectTargetOptions}
            onChange={async (e) => {
              await Promise.all([
                setFieldValue("redirectTarget", e.value),
                setFieldValue("redirectPageId", null),
                setFieldValue("redirectUrl", null),
              ]);
            }}
            className="w-full"
          />
        </div>

        {values.redirectTarget === "page" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-100">
              {t("pages.redirectPage")}
            </label>
            <AutoComplete
              value={pagesAutocompleteValue}
              onChange={async (event) => {
                setPagesAutocompleteValue(
                  event.value as unknown as PageListItemView,
                );
                await setFieldValue(
                  "redirectPageId",
                  (event?.value as unknown as PageListItemView)?.id,
                );
              }}
              suggestions={searchResults?.pages as never[]}
              completeMethod={handleSearch}
              field="name"
              placeholder={t("pages.redirectPagePlaceholder")}
              className="w-full"
            />
          </div>
        )}

        {values.redirectTarget === "url" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-100">
              {t("pages.redirectUrl")}
            </label>
            <Field name="redirectUrl">
              {({ field }: { field: FieldInputProps<string> }) => (
                <InputText
                  id="redirectUrl"
                  size="small"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    setFieldValue("redirectUrl", e.target.value || null);
                  }}
                  placeholder={t("pages.urlPlaceholder")}
                  className={inputClassName}
                />
              )}
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

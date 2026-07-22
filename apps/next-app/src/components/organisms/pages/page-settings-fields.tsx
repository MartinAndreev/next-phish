"use client";

import { useState } from "react";
import type { FieldInputProps } from "formik";
import { ErrorMessage, Field } from "formik";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { AssetCatalogTab } from "@/src/components/organisms/catalog/asset-catalog";
import { selectSmall } from "@/src/components/ui/theme-constants";
import { trpc } from "@/src/lib/trpc";

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
    path: string | null;
    type: "LANDING" | "REDIRECT";
    status: "DRAFT" | "ACTIVE";
    captureData: boolean;
    redirectTarget: "none" | "page" | "url";
    redirectPageId: string | null;
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
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectorOffset, setSelectorOffset] = useState(0);
  const selectorLimit = 6;
  const { data: pageOptions, isLoading: pageOptionsLoading } =
    trpc.page.list.useQuery(
      {
        search: searchQuery || undefined,
        selectedId: selectorVisible
          ? undefined
          : (values.redirectPageId ?? undefined),
        limit: selectorLimit,
        offset: selectorOffset,
        filters: { status: "ACTIVE", type: "REDIRECT" },
      },
      {
        enabled: selectorVisible || Boolean(values.redirectPageId),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    );
  const selectedPage = pageOptions?.pages.find(
    (page) => page.id === values.redirectPageId,
  );
  const selectablePages = (pageOptions?.pages ?? []).filter(
    (page) => page.id !== pageId,
  );

  return (
    <div className="flex flex-col gap-3 mb-3">
      <div className="space-y-2">
        <label
          htmlFor="page-type"
          className="block text-sm font-medium text-zinc-100"
        >
          {t("pages.type")}
        </label>
        <Dropdown
          inputId="page-type"
          pt={selectSmall}
          value={values.type}
          options={typeOptions}
          onChange={(e) => setFieldValue("type", e.value)}
          disabled={Boolean(pageId)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="page-path"
          className="block text-sm font-medium text-zinc-100"
        >
          {t("pages.path")}
        </label>
        <Field name="path">
          {({ field }: { field: FieldInputProps<string | null> }) => (
            <InputText
              id="page-path"
              size="small"
              {...field}
              value={field.value ?? ""}
              placeholder={t("pages.pathPlaceholder")}
              className={inputClassName}
            />
          )}
        </Field>
        <p className="text-xs leading-5 text-zinc-500">{t("pages.pathHint")}</p>
        <ErrorMessage
          name="path"
          component="p"
          className="text-xs text-red-400"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="page-status"
          className="block text-sm font-medium text-zinc-100"
        >
          {t("pages.status")}
        </label>
        <Dropdown
          inputId="page-status"
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
          <label
            htmlFor="page-redirect-target"
            className="block text-sm font-medium text-zinc-100"
          >
            {t("pages.redirectTarget")}
          </label>
          <Dropdown
            inputId="page-redirect-target"
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
            <span className="block text-sm font-medium text-zinc-100">
              {t("pages.redirectPage")}
            </span>
            <div className="rounded-xl border border-white/10 bg-brand-navy/40 p-3">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {selectedPage?.name ?? t("pages.noRedirectPageSelected")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedPage?.path
                      ? `/${selectedPage.path}`
                      : t("pages.redirectPageHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="small"
                  outlined
                  icon="pi pi-images"
                  label={
                    selectedPage
                      ? t("pages.changeRedirectPage")
                      : t("pages.selectRedirectPage")
                  }
                  onClick={() => setSelectorVisible(true)}
                  className="w-full justify-center whitespace-nowrap"
                />
              </div>
              {values.redirectPageId ? (
                <Button
                  type="button"
                  text
                  severity="secondary"
                  size="small"
                  icon="pi pi-times"
                  label={t("pages.clearRedirectPage")}
                  className="mt-2 px-0"
                  onClick={() => setFieldValue("redirectPageId", null)}
                />
              ) : null}
            </div>
          </div>
        )}

        {values.redirectTarget === "url" && (
          <div className="space-y-2">
            <label
              htmlFor="redirectUrl"
              className="block text-sm font-medium text-zinc-100"
            >
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

      <Dialog
        visible={selectorVisible}
        onHide={() => setSelectorVisible(false)}
        header={t("pages.selectRedirectPage")}
        modal
        dismissableMask
        draggable={false}
        className="w-[min(72rem,calc(100vw-2rem))]"
        contentClassName="p-0"
      >
        <AssetCatalogTab
          title={t("pages.redirectPageCatalogTitle")}
          description={t("pages.redirectPageCatalogDescription")}
          searchPlaceholder={t("pages.redirectPagePlaceholder")}
          emptyMessage={t("pages.noRedirectPages")}
          items={selectablePages}
          total={pageOptions?.total ?? 0}
          loading={pageOptionsLoading}
          selectedId={values.redirectPageId ?? ""}
          search={searchQuery}
          offset={selectorOffset}
          limit={selectorLimit}
          onSearch={(value) => {
            setSearchQuery(value);
            setSelectorOffset(0);
          }}
          onPage={setSelectorOffset}
          onSelect={(id) => {
            void setFieldValue("redirectPageId", id);
            setSelectorVisible(false);
          }}
        />
      </Dialog>
    </div>
  );
}

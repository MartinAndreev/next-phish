"use client";

import { Form, Formik } from "formik";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import type { ZodCompatible } from "@/src/lib/to-formik-validation";
import { z } from "zod";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { FormMessage } from "@/src/components/atoms/form-message";
import { PreviousImportsList } from "./previous-imports-list";
import { ImportUrlField } from "./import-url-field";
import { AssetsToggle } from "./assets-toggle";
import { ImportProgressView } from "./import-progress-view";
import { useImportDialog } from "@/src/hooks/use-import-dialog";

const importSchema = z.object({
  url: z.string().url("Must be a valid URL"),
}) as unknown as ZodCompatible;

interface ImportWebsiteDialogProps {
  visible: boolean;
  t: (key: string) => string;
  onImportComplete: (html: string) => void;
  onHide: () => void;
}

export function ImportWebsiteDialog({
  visible,
  t,
  onImportComplete,
  onHide,
}: ImportWebsiteDialogProps) {
  const {
    state,
    dispatch,
    previousImports,
    handleImport,
    handleSelectPrevious,
    handleSearch,
    handleHide,
  } = useImportDialog({ t, onImportComplete, onHide });

  const footer = (
    <div className="flex gap-2">
      <Button
        size="small"
        type="button"
        outlined
        label={t("common.cancel")}
        onClick={handleHide}
        className="rounded-xl border-[#1C2945] px-5 py-3 text-sm font-medium text-white"
      />
      {!state.jobId && (
        <Button
          size="small"
          type="submit"
          form="import-form"
          label={t("pages.importWebsiteButton")}
          icon="pi pi-download"
          loading={state.importing}
          disabled={state.importing}
          className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
        />
      )}
    </div>
  );

  return (
    <Dialog
      header={t("pages.importWebsiteTitle")}
      visible={visible}
      draggable={false}
      dismissableMask
      onHide={handleHide}
      footer={footer}
      className="max-w-lg"
    >
      <div className="space-y-4">
        {!state.jobId ? (
          <>
            <p className="text-sm leading-relaxed text-zinc-400">
              {t("pages.importWebsiteHint")}
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="text-xs leading-relaxed text-amber-400">
                {t("pages.importWebsiteWarning")}
              </p>
            </div>

            <Formik
              initialValues={{ url: state.url }}
              validate={toFormikValidation(importSchema)}
              onSubmit={(values) => {
                dispatch({ type: "SET_URL", url: values.url });
                handleImport(values.url, state.includeAssets);
              }}
            >
              {() => (
                <Form id="import-form" className="space-y-4">
                  <ImportUrlField t={t} />

                  <AssetsToggle
                    checked={state.includeAssets}
                    t={t}
                    onChange={(value) =>
                      dispatch({ type: "SET_INCLUDE_ASSETS", value })
                    }
                  />
                </Form>
              )}
            </Formik>

            <PreviousImportsList
              imports={previousImports}
              t={t}
              onSelect={handleSelectPrevious}
              onSearch={handleSearch}
            />

            {state.error && (
              <FormMessage variant="error">{state.error}</FormMessage>
            )}
          </>
        ) : (
          <ImportProgressView progress={state.progress} t={t} />
        )}
      </div>
    </Dialog>
  );
}

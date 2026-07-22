"use client";

import { ErrorMessage, Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { ColorPicker } from "primereact/colorpicker";
import { Checkbox } from "primereact/checkbox";
import type { TaskStatusFormValues } from "@next-phish/shared";
import { useTranslation } from "@/src/lib/i18n/client";
import { FormField } from "@/src/components/molecules/form-field";

export function StatusFormPresentation({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  const { isSubmitting, values, setFieldValue, setFieldTouched } =
    useFormikContext<TaskStatusFormValues>();
  const t = useTranslation();
  return (
    <Form className="space-y-4">
      <FormField name="name" label={t("tasks.name")} />
      <div className="rounded-lg border border-[#1C2945] bg-brand-navy p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            inputId="status-marks-done"
            name="marksTaskDone"
            checked={values.marksTaskDone}
            onChange={(event) =>
              setFieldValue("marksTaskDone", Boolean(event.checked))
            }
          />
          <label
            htmlFor="status-marks-done"
            className="cursor-pointer text-sm font-medium text-white"
          >
            {t("tasks.marksDone")}
          </label>
        </div>
        <p className="ml-8 mt-1 text-xs text-zinc-500">
          {t("tasks.marksDoneHint")}
        </p>
      </div>
      <div>
        <label htmlFor="status-color" className="block text-sm text-zinc-300">
          {t("tasks.color")}
        </label>
        <div className="mt-1 flex h-11 items-center gap-3 rounded-lg border border-[#1C2945] bg-brand-navy px-3">
          <ColorPicker
            inputId="status-color"
            name="colorToken"
            format="hex"
            value={values.colorToken.replace("#", "")}
            onChange={(event) =>
              setFieldValue("colorToken", `#${String(event.value)}`)
            }
            onBlur={() => setFieldTouched("colorToken", true)}
            inputClassName="h-7 w-10 cursor-pointer rounded border border-[#344565]"
            panelClassName="task-color-picker-panel"
            pt={{
              panel: { className: "task-color-picker-panel" },
            }}
          />
          <span className="font-mono text-sm uppercase text-zinc-300">
            {values.colorToken}
          </span>
        </div>
        <ErrorMessage
          name="colorToken"
          component="p"
          className="mt-1 text-xs text-red-400"
        />
      </div>
      <p className="text-xs text-zinc-500">{t("tasks.statusPermission")}</p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          label={t("tasks.cancel")}
          severity="secondary"
          size="small"
          className="h-9 px-3 text-sm"
          onClick={onCancel}
        />
        <Button
          type="submit"
          label={submitLabel}
          size="small"
          className="h-9 px-3 text-sm"
          loading={isSubmitting}
        />
      </div>
    </Form>
  );
}

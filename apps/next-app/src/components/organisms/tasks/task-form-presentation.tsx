"use client";

import { ErrorMessage, Form, useFormikContext } from "formik";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Editor } from "primereact/editor";
import type { TaskFormValues } from "@next-phish/shared";
import { useTranslation } from "@/src/lib/i18n/client";
import { TaskResourcePicker } from "./task-resource-picker";
import { FormField } from "@/src/components/molecules/form-field";
import { selectSmall } from "@/src/components/ui/theme-constants";

function toLocalDateTime(value: Date | null | undefined) {
  if (!value) return null;
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

interface Props {
  statuses: Array<{ id: string; name: string }>;
  currentResource?: { id: string; name: string };
  onCancel: () => void;
}
export function TaskFormPresentation({
  statuses,
  currentResource,
  onCancel,
}: Props) {
  const { isSubmitting, values, setFieldValue, setFieldTouched } =
    useFormikContext<TaskFormValues>();
  const t = useTranslation();
  const priorityOptions = [
    { label: t("tasks.low"), value: "LOW" },
    { label: t("tasks.medium"), value: "MEDIUM" },
    { label: t("tasks.high"), value: "HIGH" },
  ];
  return (
    <Form className="space-y-4">
      <FormField name="title" label={t("tasks.titleField")} />
      <div>
        <p id="task-description-label" className="mb-1 text-sm text-zinc-300">
          {t("tasks.description")}
        </p>
        <Editor
          id="task-description"
          value={values.description}
          onTextChange={(event) =>
            setFieldValue("description", event.htmlValue ?? "")
          }
          onBlur={() => setFieldTouched("description", true)}
          aria-labelledby="task-description-label"
          style={{ height: "9rem" }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="task-status" className="block text-sm text-zinc-300">
          {t("tasks.status")}
          <Dropdown
            inputId="task-status"
            aria-label={t("tasks.status")}
            name="statusId"
            value={values.statusId}
            options={statuses}
            optionLabel="name"
            optionValue="id"
            onChange={(event) => setFieldValue("statusId", event.value)}
            onBlur={() => setFieldTouched("statusId", true)}
            className="mt-1 w-full"
            pt={selectSmall}
          />
        </label>
        <label htmlFor="task-priority" className="block text-sm text-zinc-300">
          {t("tasks.priority")}
          <Dropdown
            inputId="task-priority"
            aria-label={t("tasks.priority")}
            name="priority"
            value={values.priority}
            options={priorityOptions}
            onChange={(event) => setFieldValue("priority", event.value)}
            onBlur={() => setFieldTouched("priority", true)}
            className="mt-1 w-full"
            pt={selectSmall}
          />
        </label>
      </div>
      <div>
        <label htmlFor="task-due" className="block text-sm text-zinc-300">
          {t("tasks.dueDate")}
        </label>
        <Calendar
          inputId="task-due"
          value={values.dueAt ? new Date(values.dueAt) : null}
          onChange={(event) =>
            setFieldValue("dueAt", toLocalDateTime(event.value as Date | null))
          }
          onBlur={() => setFieldTouched("dueAt", true)}
          showIcon
          showTime
          hourFormat="24"
          showButtonBar
          dateFormat="yy-mm-dd"
          className="mt-1 w-full"
          inputClassName="text-xs"
        />
        <ErrorMessage
          name="dueAt"
          component="p"
          className="mt-1 text-xs text-red-400"
        />
      </div>
      <TaskResourcePicker currentResource={currentResource} />
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
          label={t("tasks.saveTask")}
          size="small"
          className="h-9 px-3 text-sm"
          loading={isSubmitting}
        />
      </div>
    </Form>
  );
}

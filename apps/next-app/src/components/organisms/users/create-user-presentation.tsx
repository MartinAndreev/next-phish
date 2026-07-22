"use client";

import { ErrorMessage, Field, Form, useFormikContext } from "formik";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import type { AdminCreateUserInput } from "@next-phish/shared";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";

interface Props {
  organizations: Array<{ id: string; name: string }>;
  error: string;
  onCancel: () => void;
}

export function CreateUserPresentation({
  organizations,
  error,
  onCancel,
}: Props) {
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<AdminCreateUserInput>();
  const fieldClass = "w-full";

  return (
    <Form className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          htmlFor="create-user-name"
          className="space-y-2 text-sm text-zinc-200"
        >
          <span>Name</span>
          <Field
            id="create-user-name"
            as={InputText}
            name="name"
            size="small"
            className={fieldClass}
            autoComplete="off"
          />
          <ErrorMessage name="name" component="p" className={errorClassName} />
        </label>
        <label
          htmlFor="create-user-email"
          className="space-y-2 text-sm text-zinc-200"
        >
          <span>Email</span>
          <Field
            id="create-user-email"
            as={InputText}
            name="email"
            type="email"
            size="small"
            className={fieldClass}
            autoComplete="off"
          />
          <ErrorMessage name="email" component="p" className={errorClassName} />
        </label>
      </div>
      <label
        htmlFor="create-user-role"
        className="block space-y-2 text-sm text-zinc-200"
      >
        <span>System role</span>
        <Field
          inputId="create-user-role"
          as={Dropdown}
          name="role"
          options={[
            { label: "Member", value: "user" },
            { label: "Administrator", value: "admin" },
          ]}
          className={fieldClass}
          pt={{ input: { className: "px-3 py-2 text-sm" } }}
        />
      </label>
      <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
        <legend className="px-1 text-sm font-medium text-white">
          Organization access
        </legend>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-200">
          <RadioButton
            inputId="org-self"
            checked={values.organizationMode === "self"}
            onChange={() => {
              void setFieldValue("organizationMode", "self");
              void setFieldValue("organizationId", "");
            }}
          />
          <span>
            <strong className="block text-white">
              Let the user create one
            </strong>
            The user will create an organization after setting their password.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-200">
          <RadioButton
            inputId="org-existing"
            checked={values.organizationMode === "existing"}
            onChange={() => void setFieldValue("organizationMode", "existing")}
          />
          <span className="flex-1">
            <strong className="block text-white">Assign an organization</strong>
            Add the user as a member of an existing organization.
          </span>
        </label>
        {values.organizationMode === "existing" && (
          <div className="pl-8">
            <Field
              as={Dropdown}
              name="organizationId"
              options={organizations}
              optionLabel="name"
              optionValue="id"
              placeholder="Select organization"
              filter
              className={fieldClass}
              pt={{ input: { className: "px-3 py-2 text-sm" } }}
            />
            <ErrorMessage
              name="organizationId"
              component="p"
              className={errorClassName}
            />
          </div>
        )}
      </fieldset>
      <p className="text-xs leading-5 text-zinc-400">
        A welcome email with a secure magic link will be queued. The user must
        set an initial password before accessing any application or organization
        data.
      </p>
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          size="small"
          label="Cancel"
          severity="secondary"
          outlined
          onClick={onCancel}
        />
        <Button
          type="submit"
          size="small"
          label="Create and send welcome email"
          loading={isSubmitting}
        />
      </div>
    </Form>
  );
}

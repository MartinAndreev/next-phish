"use client";

import { ErrorMessage, Field, Form, useFormikContext } from "formik";
import type { FieldInputProps } from "formik";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { FormMessage } from "@/src/components/atoms/form-message";
import { errorClassName } from "@/src/components/atoms/form-message.styles";

interface Values {
  password: string;
  confirmPassword: string;
}

export function InitialPasswordPresentation({ error }: { error: string }) {
  const { isSubmitting } = useFormikContext<Values>();

  return (
    <Form className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-100">
          New password
        </label>
        <Field name="password">
          {({ field }: { field: FieldInputProps<string> }) => (
            <Password
              id="password"
              {...field}
              size={"small" as never}
              toggleMask
              feedback
              className="w-full"
              inputClassName="w-full"
              pt={{ iconField: { root: { className: "w-full" } } }}
            />
          )}
        </Field>
        <ErrorMessage
          name="password"
          component="p"
          className={errorClassName}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-zinc-100"
        >
          Confirm password
        </label>
        <Field name="confirmPassword">
          {({ field }: { field: FieldInputProps<string> }) => (
            <Password
              id="confirmPassword"
              {...field}
              size={"small" as never}
              toggleMask
              feedback={false}
              className="w-full"
              inputClassName="w-full"
              pt={{ iconField: { root: { className: "w-full" } } }}
            />
          )}
        </Field>
        <ErrorMessage
          name="confirmPassword"
          component="p"
          className={errorClassName}
        />
      </div>
      {error && <FormMessage variant="error">{error}</FormMessage>}
      <Button
        type="submit"
        size="small"
        label="Set password and continue"
        loading={isSubmitting}
        className="w-full"
      />
    </Form>
  );
}

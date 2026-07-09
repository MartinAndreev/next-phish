"use client";

import { Formik, Form } from "formik";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FormField } from "@/src/components/molecules/form-field";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { targetGroupUserSchema } from "@next-phish/shared";

interface AddUserDialogProps {
  visible: boolean;
  onHide: () => void;
  targetGroupId: string;
}

export function AddUserDialog({
  visible,
  onHide,
  targetGroupId,
}: AddUserDialogProps) {
  const t = useTranslation();
  const utils = trpc.useUtils();

  const addUserMutation = trpc.targetGroup.addUser.useMutation({
    onSuccess: () => {
      utils.targetGroup.invalidate();
      onHide();
    },
  });

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={t("targetGroups.addUser")}
      className="w-full max-w-md"
      draggable={false}
      dismissableMask={true}
    >
      <Formik
        initialValues={{
          email: "",
          firstName: "",
          lastName: "",
          position: "",
        }}
        validate={toFormikValidation(targetGroupUserSchema)}
        onSubmit={(values, { resetForm }) => {
          addUserMutation.mutate({
            targetGroupId,
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            position: values.position || undefined,
          });
          resetForm();
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-4">
            <FormField
              name="email"
              label={`${t("targetGroups.email")} *`}
              type="email"
              placeholder="you@example.com"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="firstName"
                label={`${t("targetGroups.firstName")} *`}
                placeholder="John"
              />
              <FormField
                name="lastName"
                label={`${t("targetGroups.lastName")} *`}
                placeholder="Doe"
              />
            </div>
            <FormField
              name="position"
              label={t("targetGroups.position")}
              placeholder={t("targetGroups.positionPlaceholder")}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                size="small"
                label={t("common.cancel")}
                severity="secondary"
                onClick={onHide}
              />
              <Button
                type="submit"
                size="small"
                label={t("common.create")}
                loading={isSubmitting}
                className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
              />
            </div>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

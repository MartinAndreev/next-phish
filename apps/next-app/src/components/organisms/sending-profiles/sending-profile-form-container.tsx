"use client";

import { Formik, Form } from "formik";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useFormStatus } from "@/src/hooks/use-form-status";
import { useTranslation } from "@/src/lib/i18n";
import { trpc } from "@/src/lib/trpc";
import { SendingProfileFormPresentation } from "./sending-profile-form-presentation";
import type { MailProviderType } from "@next-phish/backend";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Profile name is required"),
  providerType: z.string().min(1, "Provider type is required"),
  fromName: z.string().trim().min(1, "From name is required"),
  fromEmail: z.string().email("From email must be valid"),
  replyToEmail: z
    .string()
    .email()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  isDefault: z.boolean(),
  providerConfig: z.record(z.string()),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface SendingProfileFormContainerProps {
  profileId?: string;
}

function defaultFormValues(): ProfileFormValues {
  return {
    name: "",
    providerType: "",
    fromName: "",
    fromEmail: "",
    replyToEmail: "",
    isDefault: false,
    providerConfig: {},
  };
}

function valuesFromProfile(profile: {
  name: string;
  providerType: string;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  isDefault: boolean;
  providerConfig: Record<string, unknown>;
}): ProfileFormValues {
  const config: Record<string, string> = {};
  for (const [key, value] of Object.entries(profile.providerConfig)) {
    if (value === null || value === undefined) continue;
    config[key] = typeof value === "string" ? value : String(value);
  }
  return {
    name: profile.name,
    providerType: profile.providerType,
    fromName: profile.fromName,
    fromEmail: profile.fromEmail,
    replyToEmail: profile.replyToEmail ?? "",
    isDefault: profile.isDefault,
    providerConfig: config,
  };
}

function serializeProviderConfig(
  config: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value === "true") {
      result[key] = true;
    } else if (value === "false") {
      result[key] = false;
    } else if (/^\d+$/.test(value)) {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatValidationError(err: unknown): string {
  if (!err || typeof err !== "object") return "An unexpected error occurred";

  const anyErr = err as Record<string, unknown>;

  const data = anyErr.data as Record<string, unknown> | undefined;
  const issues = data?.zodError as
    | Array<{ message: string; path: Array<string | number> }>
    | undefined;

  if (issues?.length) {
    return issues.map((issue) => issue.message).join("; ");
  }

  return String(anyErr.message ?? "An unexpected error occurred");
}

export function SendingProfileFormContainer({
  profileId,
}: SendingProfileFormContainerProps) {
  const t = useTranslation();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { status, setError } = useFormStatus();

  const { data: profile, isLoading } = trpc.mailSending.getById.useQuery(
    { id: profileId ?? "" },
    { enabled: Boolean(profileId) },
  );

  const createMutation = trpc.mailSending.create.useMutation({
    onSuccess: () => {
      utils.mailSending.list.invalidate();
      router.push("/sending-profiles");
    },
    onError: (err) => setError(formatValidationError(err)),
  });

  const updateMutation = trpc.mailSending.update.useMutation({
    onSuccess: () => {
      utils.mailSending.list.invalidate();
      if (profileId) {
        utils.mailSending.getById.invalidate({ id: profileId });
      }
      router.push("/sending-profiles");
    },
    onError: (err) => setError(formatValidationError(err)),
  });

  if (profileId && isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 h-8 w-64 rounded bg-zinc-700" />
        <div className="mb-4 h-8 w-full rounded bg-zinc-700" />
        <div className="mb-4 h-8 w-full rounded bg-zinc-700" />
      </div>
    );
  }

  const initialValues = profile
    ? valuesFromProfile(profile)
    : defaultFormValues();

  async function handleSubmit(values: ProfileFormValues) {
    const config = serializeProviderConfig(values.providerConfig);

    if (profileId) {
      updateMutation.mutate({
        id: profileId,
        name: values.name,
        fromName: values.fromName,
        fromEmail: values.fromEmail,
        replyToEmail: values.replyToEmail || undefined,
        isDefault: values.isDefault,
        providerConfig: config,
      });
    } else {
      createMutation.mutate({
        name: values.name,
        providerType: values.providerType as MailProviderType,
        fromName: values.fromName,
        fromEmail: values.fromEmail,
        replyToEmail: values.replyToEmail || undefined,
        isDefault: values.isDefault,
        providerConfig: config,
      });
    }
  }

  const isEdit = Boolean(profileId);

  return (
    <Formik
      initialValues={initialValues}
      validate={toFormikValidation(formSchema)}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-6">
          <SendingProfileFormPresentation
            error={status.type === "error" ? status.message : ""}
            isEdit={isEdit}
          />

          <div className="flex justify-end gap-3">
            <Button
              size="small"
              type="button"
              label={t("common.cancel")}
              severity="secondary"
              onClick={() => router.push("/sending-profiles")}
            />
            <Button
              size="small"
              type="submit"
              label={isEdit ? t("common.saveChanges") : t("common.create")}
              loading={isSubmitting}
              className="rounded-xl border-0 bg-(image:--brand-gradient) px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(41,184,255,0.25)]"
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}

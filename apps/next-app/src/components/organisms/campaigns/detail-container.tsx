"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "primereact/badge";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import type { inferRouterOutputs } from "@trpc/server";
import { FormMessage } from "@/src/components/atoms/form-message";
import type { AppRouter } from "@/src/server/trpc/router";
import { trpc } from "@/src/lib/trpc";

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatDate(value: Date | string, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(value));
}

function statusSeverity(status: string) {
  if (["PUBLISHED", "ACTIVE"].includes(status)) return "success" as const;
  if (["FAILED", "CANCELLED"].includes(status)) return "danger" as const;
  if (["PENDING_START", "SCHEDULED", "PAUSED"].includes(status))
    return "warning" as const;
  return "secondary" as const;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-100">{value}</dd>
    </div>
  );
}

function ResourceRow({
  icon,
  label,
  name,
  detail,
  status,
  onOpen,
}: {
  icon: string;
  label: string;
  name: string;
  detail?: string;
  status?: string;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!onOpen}
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-brand-navy/30 p-4 text-left transition enabled:cursor-pointer enabled:hover:border-brand-blue/50 enabled:hover:bg-brand-blue/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <i className={icon} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-zinc-500">{label}</span>
        <span className="block truncate text-sm font-medium text-white">
          {name}
        </span>
        {detail ? (
          <span className="mt-0.5 block truncate text-xs text-zinc-400">
            {detail}
          </span>
        ) : null}
      </span>
      {status ? (
        <Badge value={formatLabel(status)} severity={statusSeverity(status)} />
      ) : null}
      {onOpen ? (
        <i className="pi pi-angle-right text-zinc-500" aria-hidden="true" />
      ) : null}
    </button>
  );
}

type CampaignDetail = NonNullable<
  inferRouterOutputs<AppRouter>["campaign"]["getById"]
>;

function CampaignDetailContent({
  data,
  recipientCount,
  schedules,
  onNavigate,
}: {
  data: CampaignDetail;
  recipientCount: number;
  schedules: CampaignDetail["scheduleSources"][number]["schedule"][];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Campaign type" value={formatLabel(data.type)} />
            <DetailItem label="Target timezone" value={data.targetTimezone} />
            <DetailItem
              label="Automatic completion"
              value={
                data.autoCompleteAfterDays
                  ? `${data.autoCompleteAfterDays} days after start`
                  : "Disabled"
              }
            />
            <DetailItem
              label="Created by"
              value={data.createdBy.name || data.createdBy.email}
            />
            <DetailItem
              label="Created"
              value={formatDate(data.createdAt, data.targetTimezone)}
            />
            <DetailItem
              label="Last updated"
              value={formatDate(data.updatedAt, data.targetTimezone)}
            />
            {data.sourceCampaign ? (
              <DetailItem
                label="Cloned from"
                value={
                  <button
                    type="button"
                    className="cursor-pointer text-brand-blue hover:text-brand-azure"
                    onClick={() =>
                      onNavigate(`/campaigns/${data.sourceCampaign?.id}`)
                    }
                  >
                    {data.sourceCampaign.name}
                  </button>
                }
              />
            ) : null}
            <DetailItem label="Clones" value={data._count.clones} />
            <DetailItem label="Campaign ID" value={data.id} />
          </dl>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Tags
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.tags.length ? (
                data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-medium text-brand-blue"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-500">No tags</span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
          <h2 className="text-lg font-semibold text-white">Campaign assets</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Content and delivery identity used by this campaign.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <ResourceRow
              icon="pi pi-envelope"
              label="Email template"
              name={data.emailTemplate?.name ?? "Not selected"}
              detail={data.emailTemplate?.tags.join(", ") || undefined}
              status={data.emailTemplate?.status}
              onOpen={
                data.emailTemplate
                  ? () =>
                      onNavigate(`/email-templates/${data.emailTemplate?.id}`)
                  : undefined
              }
            />
            <ResourceRow
              icon="pi pi-window-maximize"
              label="Landing page"
              name={data.page?.name ?? "Not selected"}
              detail={data.page ? formatLabel(data.page.type) : undefined}
              status={data.page?.status}
              onOpen={
                data.page
                  ? () => onNavigate(`/pages/${data.page?.id}`)
                  : undefined
              }
            />
            <ResourceRow
              icon="pi pi-send"
              label="Sending profile"
              name={data.mailSendingProfile?.name ?? "Not selected"}
              detail={
                data.mailSendingProfile
                  ? `${formatLabel(data.mailSendingProfile.providerType)} · ${data.mailSendingProfile.fromName} <${data.mailSendingProfile.fromEmail}>`
                  : undefined
              }
              onOpen={
                data.mailSendingProfile
                  ? () =>
                      onNavigate(
                        `/sending-profiles/${data.mailSendingProfile?.id}`,
                      )
                  : undefined
              }
            />
            <ResourceRow
              icon="pi pi-users"
              label="Target group"
              name={
                data.targetGroup?.name ??
                (data.type === "TEMPLATE"
                  ? "Selected when scheduled"
                  : "Not selected")
              }
              detail={
                data.targetGroup ? `${recipientCount} recipients` : undefined
              }
              status={data.targetGroup?.status}
              onOpen={
                data.targetGroup
                  ? () => onNavigate(`/target-groups/${data.targetGroup?.id}`)
                  : undefined
              }
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Audience</h2>
            <i className="pi pi-users text-brand-blue" aria-hidden="true" />
          </div>
          <dl className="mt-5 space-y-4">
            <DetailItem
              label="Target group"
              value={data.targetGroup?.name ?? "Inherited when scheduled"}
            />
            <DetailItem label="Recipients" value={recipientCount || "—"} />
            <DetailItem label="Timezone" value={data.targetTimezone} />
          </dl>
        </section>

        <section className="rounded-2xl border border-[#1C2945] bg-brand-dark p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Schedule</h2>
            <i className="pi pi-calendar text-brand-blue" aria-hidden="true" />
          </div>
          {schedules.length ? (
            <div className="mt-4 space-y-3">
              {schedules.map((schedule) => (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => onNavigate(`/schedule/${schedule.id}`)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-brand-navy/30 p-4 text-left transition hover:border-brand-blue/50"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-medium text-white">
                        {schedule.name}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-400">
                        {formatDate(schedule.startsAt, schedule.targetTimezone)}
                      </span>
                    </span>
                    <Badge
                      value={formatLabel(schedule.status)}
                      severity={statusSeverity(schedule.status)}
                    />
                  </span>
                  <span className="mt-3 block text-xs text-zinc-500">
                    {formatLabel(schedule.deliveryMode)} ·{" "}
                    {schedule.targetTimezone}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
              <i
                className="pi pi-calendar-times text-2xl text-zinc-600"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm text-zinc-400">
                No schedule is attached.
              </p>
            </div>
          )}
        </section>

        {data.brokenAt || data.brokenReason ? (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
            <h2 className="font-semibold text-red-300">Campaign health</h2>
            <p className="mt-2 text-sm text-red-200/80">
              {data.brokenReason ?? "Campaign resources require attention."}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function CampaignDetailContainer({
  id,
  saved,
}: {
  id: string;
  saved?: string;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, isLoading } = trpc.campaign.getById.useQuery({ id });

  const invalidate = () =>
    Promise.all([
      utils.campaign.getById.invalidate({ id }),
      utils.campaign.list.invalidate(),
    ]);
  const mutationOptions = (message: string) => ({
    onSuccess: async () => {
      await invalidate();
      setActionError("");
      setActionMessage(message);
    },
    onError: (error: { message: string }) => {
      setActionMessage("");
      setActionError(error.message);
    },
  });
  const publish = trpc.campaign.publish.useMutation(
    mutationOptions("Campaign published successfully."),
  );
  const pause = trpc.campaign.pause.useMutation(
    mutationOptions("Campaign paused successfully."),
  );
  const resume = trpc.campaign.resume.useMutation(
    mutationOptions("Campaign resumed successfully."),
  );
  const complete = trpc.campaign.complete.useMutation(
    mutationOptions("Campaign completed successfully."),
  );
  const clone = trpc.campaign.clone.useMutation({
    onSuccess: (copy) => router.push(`/campaigns/${copy.id}?saved=cloned`),
    onError: (error) => setActionError(error.message),
  });

  if (isLoading) return <p className="p-8 text-zinc-400">Loading campaign…</p>;
  if (!data) return <p className="p-8 text-zinc-400">Campaign not found.</p>;

  const savedMessage =
    saved === "created"
      ? "Campaign created successfully."
      : saved === "updated"
        ? "Campaign updated successfully."
        : saved === "cloned"
          ? "Campaign cloned successfully."
          : "";
  const canEdit = data.status === "DRAFT" || data.status === "PUBLISHED";
  const schedules = data.scheduleSources.map((source) => source.schedule);
  const recipientCount = data.targetGroup?._count.users ?? 0;

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <BreadCrumb
            home={{ icon: "pi pi-home", url: "/" }}
            model={[
              { label: "Campaigns", url: "/campaigns" },
              { label: data.name },
            ]}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{data.name}</h1>
            <Badge
              value={formatLabel(data.status)}
              severity={statusSeverity(data.status)}
            />
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {data.type === "TEMPLATE"
              ? "Reusable campaign template"
              : "Concrete phishing simulation"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button
              size="small"
              outlined
              icon="pi pi-pencil"
              label="Edit"
              onClick={() => router.push(`/campaigns/${id}/edit`)}
            />
          ) : null}
          {data.status === "DRAFT" ? (
            <Button
              size="small"
              icon="pi pi-check"
              label="Publish"
              loading={publish.isPending}
              onClick={() => publish.mutate({ id })}
            />
          ) : null}
          <Button
            size="small"
            outlined
            icon="pi pi-copy"
            label="Clone"
            loading={clone.isPending}
            onClick={() =>
              clone.mutate({
                id,
                name: `${data.name} copy`,
                type: data.type,
                targetGroupId:
                  data.type === "CONCRETE" ? data.targetGroupId : null,
              })
            }
          />
          {data.type === "CONCRETE" && data.status === "PUBLISHED" ? (
            <Button
              size="small"
              icon="pi pi-calendar"
              label="Schedule"
              onClick={() => router.push(`/schedule/new?campaignId=${id}`)}
            />
          ) : null}
          {["PENDING_START", "ACTIVE"].includes(data.status) ? (
            <Button
              size="small"
              label="Pause"
              loading={pause.isPending}
              onClick={() => pause.mutate({ id })}
            />
          ) : null}
          {data.status === "PAUSED" ? (
            <Button
              size="small"
              label="Resume"
              loading={resume.isPending}
              onClick={() => resume.mutate({ id })}
            />
          ) : null}
          {["ACTIVE", "PAUSED"].includes(data.status) ? (
            <Button
              size="small"
              severity="danger"
              outlined
              label="Complete"
              loading={complete.isPending}
              onClick={() => complete.mutate({ id })}
            />
          ) : null}
        </div>
      </div>

      {savedMessage || actionMessage ? (
        <div className="mb-6">
          <FormMessage variant="success">
            {actionMessage || savedMessage}
          </FormMessage>
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-6">
          <FormMessage variant="error">{actionError}</FormMessage>
        </div>
      ) : null}

      <CampaignDetailContent
        data={data}
        recipientCount={recipientCount}
        schedules={schedules}
        onNavigate={(path) => router.push(path)}
      />
    </div>
  );
}

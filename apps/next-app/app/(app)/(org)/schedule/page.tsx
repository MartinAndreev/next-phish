"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { useSchedules } from "@/src/hooks/use-campaign-authoring";
import { useLocale } from "@/src/lib/i18n";

function formatScheduleStart(
  value: Date | string,
  locale: string,
  timeZone: string,
): string {
  return new Date(value).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
}

export default function SchedulePage() {
  const router = useRouter();
  const locale = useLocale();
  const { data, isLoading, cancel, duplicate } = useSchedules();
  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Schedule</h1>
          <p className="mt-1 text-sm text-zinc-400">
            One-time and recurring campaign configuration.
          </p>
        </div>
        <Button
          label="New schedule"
          icon="pi pi-plus"
          onClick={() => router.push("/schedule/new")}
          className="border-0 bg-brand-blue"
        />
      </div>
      {isLoading ? (
        <p className="text-zinc-400">Loading schedules…</p>
      ) : (
        <div className="space-y-3">
          {(data?.rows ?? []).map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-brand-dark p-4"
            >
              <button
                type="button"
                onClick={() => router.push(`/schedule/${schedule.id}`)}
                className="text-left"
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-medium text-white">{schedule.name}</h2>
                  <Badge
                    value={schedule.status}
                    severity={
                      schedule.status === "CANCELLED" ? "danger" : "info"
                    }
                  />
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {schedule.type.replace("_", " ")} ·{" "}
                  {formatScheduleStart(
                    schedule.startsAt,
                    locale,
                    schedule.targetTimezone,
                  )}
                </p>
              </button>
              <div className="flex gap-2">
                <Button
                  size="small"
                  outlined
                  label="Duplicate"
                  onClick={() => duplicate.mutate({ id: schedule.id })}
                />
                {!["COMPLETED", "CANCELLED"].includes(schedule.status) ? (
                  <Button
                    size="small"
                    outlined
                    severity="danger"
                    label="Cancel"
                    onClick={() => cancel.mutate({ id: schedule.id })}
                  />
                ) : null}
              </div>
            </div>
          ))}
          {!data?.rows.length ? (
            <p className="text-zinc-400">No schedules yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

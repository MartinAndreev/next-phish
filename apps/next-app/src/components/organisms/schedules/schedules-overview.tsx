"use client";

import { useRouter } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { Button } from "primereact/button";
import { trpc } from "@/src/lib/trpc";
import { ScheduleTable } from "./schedule-table";
import { ScheduleTimeline } from "./schedule-timeline";
import { ExecutionOperations } from "./execution-operations";

export function SchedulesOverview() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return (
    <div className="space-y-8 px-6 py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <BreadCrumb
            home={{ icon: "pi pi-home", url: "/" }}
            model={[{ label: "Schedule" }]}
          />
          <h1 className="mt-2 text-2xl font-semibold text-white">Schedule</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Plan, track, and manage campaign delivery.
          </p>
        </div>
        <Button
          type="button"
          size="small"
          label="New schedule"
          icon="pi pi-plus"
          onClick={() => router.push("/schedule/new")}
        />
      </header>

      <ExecutionOperations />
      <ScheduleTable
        onChanged={() => utils.campaign.getScheduleTimeline.invalidate()}
      />
      <ScheduleTimeline />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import type { useTaskBoard } from "@/src/hooks/use-task-board";
import { useTranslation } from "@/src/lib/i18n/client";
import { selectSmall } from "@/src/components/ui/theme-constants";

type Board = ReturnType<typeof useTaskBoard>;
type Task = Board["tasks"][number];
interface Props {
  board: Board;
  onCreate: (statusId?: string) => void;
  onEdit: (task: Board["tasks"][number]) => void;
  onManageStatuses: () => void;
}
const legacyColors: Record<string, string> = {
  neutral: "#64748b",
  blue: "#29b8ff",
  indigo: "#5c73ff",
  violet: "#7b5cff",
  cyan: "#15e5d4",
};

function statusColor(value: string) {
  return legacyColors[value] ?? value;
}

function descriptionPreview(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function TasksPresentation({
  board,
  onCreate,
  onEdit,
  onManageStatuses,
}: Props) {
  const t = useTranslation();
  const visibleStatuses = useMemo(() => {
    if (!board.filters.statusIds.length) return board.statuses;
    const selected = new Set(board.filters.statusIds);
    return board.statuses.filter((status) => selected.has(status.id));
  }, [board.filters.statusIds, board.statuses]);
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of board.tasks)
      grouped.set(task.statusId, [...(grouped.get(task.statusId) ?? []), task]);
    return grouped;
  }, [board.tasks]);
  if (board.isLoading)
    return <div className="p-6 text-zinc-400">{t("tasks.loading")}</div>;
  return (
    <section className="min-w-0 flex-1 p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {t("tasks.title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">{t("tasks.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            label={t("tasks.manageStatuses")}
            icon="pi pi-sliders-h"
            outlined
            size="small"
            className="h-9 px-3 text-sm"
            onClick={onManageStatuses}
          />
          <Button
            label={t("tasks.createTask")}
            icon="pi pi-plus"
            size="small"
            className="h-9 px-3 text-sm"
            onClick={() => onCreate()}
          />
        </div>
      </header>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="relative w-full sm:w-72">
          <i className="pi pi-search pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-zinc-500" />
          <InputText
            value={board.filters.search}
            onChange={(event) => board.setSearch(event.target.value)}
            placeholder={t("tasks.search")}
            aria-label={t("tasks.search")}
            pt={{
              root: {
                className: "h-8 w-full py-2 pl-9 pr-3 text-sm",
              },
            }}
          />
        </span>
        <Dropdown
          value={board.filters.statusIds[0] ?? ""}
          options={[
            { id: "", name: t("tasks.allStatuses") },
            ...board.statuses,
          ]}
          optionLabel="name"
          optionValue="id"
          onChange={(event) =>
            board.setStatusIds(event.value ? [event.value] : [])
          }
          aria-label={t("tasks.allStatuses")}
          className="w-full sm:w-48"
          pt={selectSmall}
        />
      </div>
      {board.error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-red-300">
          {board.error.message}
        </p>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4" aria-label="Task board">
        {visibleStatuses.map((status) => {
          const tasks = tasksByStatus.get(status.id) ?? [];
          return (
            <article
              key={status.id}
              className="w-[20rem] shrink-0 rounded-xl border border-[#1C2945] bg-brand-dark/80"
              aria-labelledby={`status-${status.id}`}
            >
              <div className="flex items-center justify-between border-b border-[#1C2945] px-4 py-3">
                <h2
                  id={`status-${status.id}`}
                  className="flex items-center gap-2 font-medium text-white"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: statusColor(status.colorToken) }}
                  />
                  {status.name}
                  <span className="text-xs text-zinc-500">{tasks.length}</span>
                </h2>
                <Button
                  icon="pi pi-plus"
                  text
                  rounded
                  size="small"
                  className="h-8 w-8"
                  aria-label={`Add task to ${status.name}`}
                  onClick={() => onCreate(status.id)}
                />
              </div>
              <div className="min-h-32 space-y-3 p-3">
                {tasks.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onCreate(status.id)}
                    className="w-full rounded-lg border border-dashed border-[#2A3958] p-5 text-sm text-zinc-500 hover:border-brand-blue hover:text-brand-blue"
                  >
                    {t("tasks.addTask")}
                  </button>
                ) : (
                  tasks.map((task) => {
                    const overdue = task.isOverdue;
                    return (
                      <div
                        key={task.id}
                        className="rounded-lg border border-[#253452] bg-brand-navy p-3 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => onEdit(task)}
                          className="w-full text-left"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="font-medium text-white">
                              {task.title}
                            </h3>
                            <span
                              className={`text-[10px] font-semibold ${task.priority === "HIGH" ? "text-red-400" : task.priority === "LOW" ? "text-zinc-500" : "text-brand-blue"}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="line-clamp-2 text-sm text-zinc-400">
                              {descriptionPreview(task.description)}
                            </p>
                          )}
                        </button>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {task.relation && (
                            <Link
                              href={task.relation.href}
                              className="rounded bg-[#13213d] px-2 py-1 text-xs text-brand-blue hover:text-brand-azure"
                            >
                              {task.relation.name}
                            </Link>
                          )}
                          {task.dueAt && (
                            <span
                              className={`text-xs ${overdue ? "text-red-400" : "text-zinc-500"}`}
                            >
                              {overdue ? `${t("tasks.overdue")} · ` : ""}
                              {new Date(task.dueAt).toISOString().slice(0, 10)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-zinc-500">
                          <label htmlFor={`task-status-${task.id}`}>
                            {t("tasks.moveTo")}
                          </label>
                          <Dropdown
                            inputId={`task-status-${task.id}`}
                            aria-label={`${t("tasks.moveTo")} ${task.title}`}
                            value={task.statusId}
                            options={board.statuses}
                            optionLabel="name"
                            optionValue="id"
                            disabled={board.move.isPending}
                            onChange={(event) =>
                              board.move.mutate({
                                id: task.id,
                                statusId: event.value,
                              })
                            }
                            className="mt-1 w-full"
                            pt={selectSmall}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          );
        })}
      </div>
      {board.total >= 100 && (
        <p className="text-sm text-zinc-500">{t("tasks.showingLimit")}</p>
      )}
    </section>
  );
}

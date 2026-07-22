"use client";

import { useState } from "react";
import { Formik } from "formik";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import {
  taskFormSchema,
  taskStatusFormSchema,
  type TaskFormValues,
  type TaskStatusFormValues,
} from "@next-phish/shared";
import { toFormikValidation } from "@/src/lib/to-formik-validation";
import { useTaskBoard } from "@/src/hooks/use-task-board";
import { TasksPresentation } from "./presentation";
import { TaskFormPresentation } from "./task-form-presentation";
import { StatusFormPresentation } from "./status-form-presentation";
import { useTranslation } from "@/src/lib/i18n/client";

type Task = ReturnType<typeof useTaskBoard>["tasks"][number];
type TaskStatus = ReturnType<typeof useTaskBoard>["statuses"][number];

export function TasksContainer() {
  const t = useTranslation();
  const board = useTaskBoard();
  const [taskOpen, setTaskOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string>();
  const openCreate = (statusId?: string) => {
    setEditing(null);
    setDefaultStatusId(statusId);
    setTaskOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setDefaultStatusId(task.statusId);
    setTaskOpen(true);
  };
  const taskInitial: TaskFormValues = editing
    ? {
        title: editing.title,
        description: editing.description ?? "",
        statusId: editing.statusId,
        priority: editing.priority,
        assigneeId: editing.assignee?.id ?? null,
        dueAt: editing.dueAt
          ? new Date(editing.dueAt).toISOString().slice(0, 16)
          : null,
        relation: editing.relation
          ? { type: editing.relation.type, id: editing.relation.id }
          : null,
      }
    : {
        title: "",
        description: "",
        statusId: defaultStatusId ?? board.statuses[0]?.id ?? "",
        priority: "MEDIUM",
        assigneeId: null,
        dueAt: null,
        relation: null,
      };

  async function submitTask(values: TaskFormValues) {
    const relation =
      values.relation?.type && values.relation.id ? values.relation : null;
    if (editing)
      await board.update.mutateAsync({
        id: editing.id,
        ...values,
        dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
        relation,
      });
    else
      await board.create.mutateAsync({
        ...values,
        dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
        relation,
      });
    setTaskOpen(false);
  }
  async function submitStatus(values: TaskStatusFormValues) {
    if (editingStatus) {
      await board.updateStatus.mutateAsync({ id: editingStatus.id, ...values });
      setEditingStatus(null);
    } else {
      await board.createStatus.mutateAsync(values);
    }
  }
  function moveStatus(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= board.statuses.length) return;
    const ids = board.statuses.map((status) => status.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    board.reorderStatuses.mutate({ statusIds: ids });
  }

  return (
    <>
      <TasksPresentation
        board={board}
        onCreate={openCreate}
        onEdit={openEdit}
        onManageStatuses={() => setStatusOpen(true)}
      />
      <Dialog
        header={editing ? t("tasks.editTask") : t("tasks.createTask")}
        visible={taskOpen}
        onHide={() => setTaskOpen(false)}
        className="w-[min(42rem,95vw)]"
      >
        {editing && (
          <div className="mb-3 flex justify-end">
            <Button
              label={t("tasks.deleteTask")}
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              className="h-8 px-2 text-sm"
              onClick={() => setDeleteConfirmOpen(true)}
            />
          </div>
        )}
        <Formik
          key={`${editing?.id ?? "new"}-${defaultStatusId}`}
          initialValues={taskInitial}
          validate={toFormikValidation(taskFormSchema)}
          validateOnChange={false}
          onSubmit={submitTask}
        >
          <TaskFormPresentation
            statuses={board.statuses}
            currentResource={
              editing?.relation
                ? { id: editing.relation.id, name: editing.relation.name }
                : undefined
            }
            onCancel={() => setTaskOpen(false)}
          />
        </Formik>
      </Dialog>
      <Dialog
        header={t("tasks.deleteTask")}
        visible={deleteConfirmOpen}
        onHide={() => setDeleteConfirmOpen(false)}
        modal
        closable={!board.remove.isPending}
        className="w-[min(28rem,92vw)]"
      >
        <p className="text-sm leading-6 text-zinc-300">
          {t("tasks.deleteDescription")}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            label={t("tasks.cancel")}
            severity="secondary"
            outlined
            size="small"
            className="h-9 px-3 text-sm"
            disabled={board.remove.isPending}
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <Button
            type="button"
            label={t("tasks.confirmDelete")}
            icon="pi pi-trash"
            severity="danger"
            size="small"
            className="h-9 px-3 text-sm"
            loading={board.remove.isPending}
            onClick={async () => {
              if (!editing) return;
              await board.remove.mutateAsync({ id: editing.id });
              setDeleteConfirmOpen(false);
              setTaskOpen(false);
            }}
          />
        </div>
      </Dialog>
      <Dialog
        header={t("tasks.manageTitle")}
        visible={statusOpen}
        onHide={() => {
          setEditingStatus(null);
          setStatusOpen(false);
        }}
        className="w-[min(38rem,95vw)]"
      >
        <div className="mb-6 space-y-2">
          {board.statuses.map((status, index) => (
            <div
              key={status.id}
              className="flex items-center gap-2 rounded-lg border border-[#1C2945] bg-brand-navy p-3"
            >
              <span className="flex-1 text-white">
                {status.name}{" "}
                <span className="text-xs text-zinc-500">
                  ({status.taskCount ?? 0})
                </span>
              </span>
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                className="h-8 w-8"
                aria-label={`${t("tasks.editStatus")} ${status.name}`}
                onClick={() => setEditingStatus(status)}
              />
              <Button
                icon="pi pi-arrow-up"
                text
                rounded
                size="small"
                className="h-8 w-8"
                disabled={index === 0}
                aria-label={`Move ${status.name} left`}
                onClick={() => moveStatus(index, -1)}
              />
              <Button
                icon="pi pi-arrow-down"
                text
                rounded
                size="small"
                className="h-8 w-8"
                disabled={index === board.statuses.length - 1}
                aria-label={`Move ${status.name} right`}
                onClick={() => moveStatus(index, 1)}
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                className="h-8 w-8"
                disabled={
                  (status.taskCount ?? 0) > 0 || board.statuses.length <= 1
                }
                aria-label={`Delete ${status.name}`}
                onClick={() => board.deleteStatus.mutate({ id: status.id })}
              />
            </div>
          ))}
        </div>
        <h3 className="mb-3 font-medium text-white">
          {editingStatus ? t("tasks.editStatus") : t("tasks.addStatus")}
        </h3>
        <Formik
          key={editingStatus?.id ?? "new-status"}
          initialValues={
            editingStatus
              ? {
                  name: editingStatus.name,
                  marksTaskDone: editingStatus.marksTaskDone,
                  colorToken: editingStatus.colorToken,
                }
              : ({
                  name: "",
                  marksTaskDone: false,
                  colorToken: "#64748b",
                } satisfies TaskStatusFormValues)
          }
          validate={toFormikValidation(taskStatusFormSchema)}
          onSubmit={submitStatus}
        >
          <StatusFormPresentation
            submitLabel={
              editingStatus ? t("tasks.saveStatus") : t("tasks.addStatus")
            }
            onCancel={() =>
              editingStatus ? setEditingStatus(null) : setStatusOpen(false)
            }
          />
        </Formik>
      </Dialog>
    </>
  );
}

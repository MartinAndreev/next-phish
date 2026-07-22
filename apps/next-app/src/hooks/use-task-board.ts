"use client";

import { useReducer } from "react";
import { trpc } from "@/src/lib/trpc";

type State = { statusIds: string[]; search: string };
type Action =
  | { type: "statuses"; value: string[] }
  | { type: "search"; value: string };
function reducer(state: State, action: Action): State {
  if (action.type === "statuses") return { ...state, statusIds: action.value };
  return { ...state, search: action.value };
}

export function useTaskBoard() {
  const [filters, dispatch] = useReducer(reducer, {
    statusIds: [],
    search: "",
  });
  const utils = trpc.useUtils();
  const input = {
    statusIds: filters.statusIds.length ? filters.statusIds : undefined,
    search: filters.search || undefined,
    limit: 100,
    offset: 0,
  };
  const tasks = trpc.task.list.useQuery(input);
  const statuses = trpc.task.statuses.useQuery();
  const invalidate = async () =>
    Promise.all([
      utils.task.list.invalidate(),
      utils.task.statuses.invalidate(),
    ]);
  const create = trpc.task.create.useMutation({ onSuccess: invalidate });
  const update = trpc.task.update.useMutation({ onSuccess: invalidate });
  const move = trpc.task.move.useMutation({ onSuccess: invalidate });
  const remove = trpc.task.delete.useMutation({ onSuccess: invalidate });
  const createStatus = trpc.task.createStatus.useMutation({
    onSuccess: invalidate,
  });
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: invalidate,
  });
  const reorderStatuses = trpc.task.reorderStatuses.useMutation({
    onSuccess: invalidate,
  });
  const deleteStatus = trpc.task.deleteStatus.useMutation({
    onSuccess: invalidate,
  });
  return {
    filters,
    setStatusIds: (value: string[]) => dispatch({ type: "statuses", value }),
    setSearch: (value: string) => dispatch({ type: "search", value }),
    tasks: tasks.data?.tasks ?? [],
    total: tasks.data?.total ?? 0,
    statuses: statuses.data ?? [],
    isLoading: tasks.isLoading || statuses.isLoading,
    error: tasks.error ?? statuses.error,
    create,
    update,
    move,
    remove,
    createStatus,
    updateStatus,
    reorderStatuses,
    deleteStatus,
  };
}

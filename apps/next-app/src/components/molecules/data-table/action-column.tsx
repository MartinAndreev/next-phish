"use client";

import { useRef } from "react";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import type { MenuItem } from "primereact/menuitem";
import type { DataTableAction } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionColumnProps<T extends Record<string, any>> {
  row: T;
  actions: DataTableAction<T>[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ActionColumn<T extends Record<string, any>>({
  row,
  actions,
}: ActionColumnProps<T>) {
  const menuRef = useRef<Menu>(null);

  const visibleActions = actions.filter(
    (action) => !action.visible || action.visible(row),
  );

  if (visibleActions.length === 0) return null;

  const items: MenuItem[] = visibleActions.map((action) => ({
    label: action.label,
    icon: action.icon,
    command: () => action.onClick(row),
    className:
      action.severity === "danger"
        ? "text-red-400 hover:bg-red-500/10"
        : undefined,
  }));

  return (
    <div className="flex justify-end">
      <Menu
        model={items}
        popup
        ref={menuRef}
        pt={{
          root: {
            className:
              "bg-brand-dark border border-white/10 rounded-xl shadow-lg p-1 max-w-[15rem]",
          },
          menu: { className: "list-none" },
          menuitem: { className: "m-0" },
          action: { className: "m-0 flex items-center gap-2" },
          content: {
            className:
              "flex items-center gap-2 text-zinc-100 cursor-pointer p-2 text-sm rounded-lg hover:bg-white/10 transition-colors",
          },
          icon: { className: "text-zinc-400" },
          separator: { className: "border-t border-white/10 my-1" },
        }}
      />
      <Button
        icon="pi pi-ellipsis-v"
        className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 hover:bg-white/10 hover:text-white"
        onClick={(e) => menuRef.current?.toggle(e)}
      />
    </div>
  );
}

"use client";

import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { twMerge } from "tailwind-merge";

const customTailwind = {
  ...Tailwind,
  menu: {
    ...Tailwind.menu,
    root: { className: "w-full border-0 bg-transparent p-0" },
    menu: { className: "list-none m-0 p-0" },
    menuitem: { className: "mb-0.5" },
    content: { className: "p-0 bg-transparent hover:bg-transparent w-full" },
    action: { className: "p-0 w-full" },
    icon: { className: "hidden" },
    submenuHeader: { className: "hidden" },
    separator: { className: "border-0" },
  },
  tooltip: {
    ...Tailwind.tooltip,
    root: {
      className:
        "bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded-md shadow-lg",
    },
    arrow: { className: "border-zinc-800" },
  },
};

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrimeReactProvider
      value={{
        unstyled: true,
        pt: customTailwind,
        ptOptions: {
          mergeSections: true,
          mergeProps: true,
          classNameMergeFunction: twMerge,
        },
      }}
    >
      {children}
    </PrimeReactProvider>
  );
}

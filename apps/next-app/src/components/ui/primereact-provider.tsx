"use client";

import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { twMerge } from "tailwind-merge";

function classNames(
  ...args: (string | boolean | undefined | null | Record<string, unknown>)[]
): string {
  return args
    .filter(Boolean)
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (typeof arg === "object" && arg !== null) {
        return Object.entries(arg)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k)
          .join(" ");
      }
      return "";
    })
    .join(" ");
}

const customTailwind = {
  ...Tailwind,

  // Menu (sidebar)
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

  // Tooltip
  tooltip: {
    ...Tailwind.tooltip,
    root: {
      className:
        "bg-zinc-800 text-zinc-100 text-xs px-2 py-1 rounded-md shadow-lg",
    },
    arrow: { className: "border-zinc-800" },
  },

  // TabView + TabPanel
  tabview: {
    ...Tailwind.tabview,
    navContainer: { className: "relative" },
    navContent: {
      className: "overflow-y-hidden overscroll-contain scroll-smooth",
    },
    nav: {
      className:
        "flex list-none m-0 p-0 bg-transparent border-0 border-b border-white/10",
    },
    panelContainer: { className: "pt-6" },
  },
  tabpanel: {
    ...Tailwind.tabpanel,
    header: { className: "mr-0" },
    headerAction: ({
      parent,
      context,
    }: {
      parent?: { state: { activeIndex: number } };
      context?: { index?: number };
    }) => ({
      className: `items-center cursor-pointer flex overflow-hidden relative select-none border-b-2 px-5 py-4 font-medium rounded-t-md transition-colors duration-200 m-0 focus:outline-none focus:outline-offset-0 ${
        parent?.state.activeIndex != null &&
        context?.index != null &&
        parent.state.activeIndex === context.index
          ? "border-cyan-400 text-white"
          : "border-transparent text-zinc-400 hover:text-white"
      }`,
    }),
    content: { className: "bg-transparent text-zinc-200 p-0" },
  },

  // Dropdown
  dropdown: {
    ...Tailwind.dropdown,
    root: {
      className:
        "cursor-pointer inline-flex relative select-none bg-white/95 border border-white/10 transition-colors duration-200 ease-in-out rounded-xl w-full hover:border-white/20 focus:outline-none focus:outline-offset-0",
    },
    header: {
      className:
        "p-3 border-b border-white/10 text-zinc-100 bg-brand-dark mt-0 rounded-tl-xl rounded-tr-xl",
    },
    panel: {
      className: "bg-brand-dark border border-white/10 rounded-xl shadow-lg",
    },
    wrapper: {
      className: "max-h-60 overflow-auto bg-brand-dark",
    },
    list: { className: "list-none p-1 m-0" },
    item: {
      className:
        "text-zinc-100 cursor-pointer font-normal whitespace-nowrap px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors",
    },
    filterContainer: { className: "relative p-2" },
    filterInput: {
      className:
        "w-full rounded-lg border border-white/10 bg-white/95 text-slate-900 px-4 py-2.5 pr-10",
    },
    filterIcon: {
      className: "absolute right-5 top-1/2 -translate-y-1/2 text-gray-400",
    },
    emptyMessage: {
      className: "text-zinc-400 px-4 py-2.5",
    },
  },

  // Button
  button: {
    ...Tailwind.button,
    root: function root({
      props,
      context,
    }: {
      props: Record<string, unknown>;
      context: Record<string, unknown>;
    }) {
      return {
        className: classNames(
          "items-center cursor-pointer inline-flex overflow-hidden relative select-none text-center align-bottom",
          "transition duration-200 ease-in-out",
          "focus:outline-none focus:outline-offset-0",
          {
            "text-white bg-brand-aqua border border-brand-aqua hover:bg-brand-blue hover:border-brand-blue focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(30,216,240,0.5)]":
              !props.link &&
              props.severity === null &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-brand-aqua bg-transparent border-transparent focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(30,216,240,0.5)]":
              props.link,
          },
          {
            "text-white bg-gray-500 border border-gray-500 hover:bg-gray-600 hover:border-gray-600":
              props.severity === "secondary" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-white bg-green-500 border border-green-500 hover:bg-green-600 hover:border-green-600":
              props.severity === "success" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-white bg-brand-aqua border border-brand-aqua hover:bg-brand-blue hover:border-brand-blue":
              props.severity === "info" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-white bg-orange-500 border border-orange-500 hover:bg-orange-600 hover:border-orange-600":
              props.severity === "warning" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-white bg-purple-500 border border-purple-500 hover:bg-purple-600 hover:border-purple-600":
              props.severity === "help" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
            "text-white bg-red-500 border border-red-500 hover:bg-red-600 hover:border-red-600":
              props.severity === "danger" &&
              !props.text &&
              !props.outlined &&
              !props.plain,
          },
          {
            "shadow-lg": props.raised,
          },
          {
            "rounded-md": !props.rounded,
            "rounded-full": props.rounded,
          },
          {
            "bg-transparent border-transparent": props.text && !props.plain,
            "text-brand-aqua hover:bg-cyan-300/20":
              props.text &&
              (props.severity === null || props.severity === "info") &&
              !props.plain,
            "text-gray-500 hover:bg-gray-300/20":
              props.text && props.severity === "secondary" && !props.plain,
            "text-green-500 hover:bg-green-300/20":
              props.text && props.severity === "success" && !props.plain,
            "text-orange-500 hover:bg-orange-300/20":
              props.text && props.severity === "warning" && !props.plain,
            "text-purple-500 hover:bg-purple-300/20":
              props.text && props.severity === "help" && !props.plain,
            "text-red-500 hover:bg-red-300/20":
              props.text && props.severity === "danger" && !props.plain,
          },
          {
            "shadow-lg": props.raised && props.text,
          },
          {
            "bg-transparent border": props.outlined && !props.plain,
            "text-brand-aqua border border-brand-aqua hover:bg-cyan-300/20":
              props.outlined &&
              (props.severity === null || props.severity === "info") &&
              !props.plain,
            "text-gray-500 border border-gray-500 hover:bg-gray-300/20":
              props.outlined && props.severity === "secondary" && !props.plain,
            "text-green-500 border border-green-500 hover:bg-green-300/20":
              props.outlined && props.severity === "success" && !props.plain,
            "text-orange-500 border border-orange-500 hover:bg-orange-300/20":
              props.outlined && props.severity === "warning" && !props.plain,
            "text-purple-500 border border-purple-500 hover:bg-purple-300/20":
              props.outlined && props.severity === "help" && !props.plain,
            "text-red-500 border border-red-500 hover:bg-red-300/20":
              props.outlined && props.severity === "danger" && !props.plain,
          },
          {
            "px-4 py-3 text-base": props.size === null,
            "text-xs py-2 px-3": props.size === "small",
            "text-xl py-3 px-4": props.size === "large",
          },
          {
            "flex-column":
              props.iconPos === "top" || props.iconPos === "bottom",
          },
          {
            "opacity-60 pointer-events-none cursor-default": (
              context as Record<string, unknown>
            ).disabled,
          },
        ),
      };
    },
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

"use client";

import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { twMerge } from "tailwind-merge";
import { RadioButtonProps } from "primereact/radiobutton";
import { AutoCompleteProps } from "primereact/autocomplete";

function classNames(
  ...args: (string | boolean | undefined | null | Record<string, unknown>)[]
): string {
  const classList: string[] = [];

  for (const arg of args) {
    if (!arg) {
      continue;
    }

    if (typeof arg === "string") {
      classList.push(arg);
      continue;
    }

    for (const [key, value] of Object.entries(arg)) {
      if (value) {
        classList.push(key);
      }
    }
  }

  return classList.join(" ");
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
  fileupload: {
    ...Tailwind.fileupload,
    basicButton: {
      className: classNames(
        "rounded-md px-2 py-1 text-sm items-center cursor-pointer inline-flex overflow-hidden relative select-none text-center align-bottom",
        "transition duration-200 ease-in-out",
        "focus:outline-none focus:outline-offset-0",
        "text-white bg-brand-aqua border border-brand-aqua hover:bg-brand-blue hover:border-brand-blue focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(30,216,240,0.5)] bg-[image:var(--brand-gradient)]",
      ),
    },
  },

  // Breadcrumb
  breadcrumb: {
    root: { className: "bg-transparent p-0" },
    menu: { className: "flex items-center gap-1" },
    action: {
      className: "text-zinc-400 hover:text-white transition-colors text-sm",
    },
    icon: { className: "text-zinc-400" },
    separator: { className: "text-zinc-600 mx-2" },
    separatorIcon: { className: "w-3 h-3" },
  },

  // Tooltip
  tooltip: {
    ...Tailwind.tooltip,
    root: {
      className:
        "absolute text-zinc-100 text-xs px-2 py-1 rounded-md shadow-lg",
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

  // Calendar
  calendar: {
    ...Tailwind.calendar,
    root: ({ props }: { props: { disabled?: boolean } }) => ({
      className: classNames(
        "relative grid h-8 max-w-full grid-cols-[minmax(0,1fr)_2rem] overflow-hidden rounded-lg border border-gray-300 bg-white transition-colors hover:border-blue-500 focus-within:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)]",
        { "pointer-events-none cursor-default opacity-60": props.disabled },
      ),
    }),
    input: {
      root: ({ parent }: { parent: { props: { showIcon?: boolean } } }) => ({
        className: classNames(
          "h-8 min-w-0 w-full appearance-none border-0 bg-white px-3 py-1.5 font-sans text-xs text-slate-700 focus:outline-none focus:shadow-none",
          parent.props.showIcon ? "rounded-none" : "rounded-lg",
        ),
      }),
    },
    icon: {
      root: {
        className: "text-slate-400",
      },
    },
    dropdownButton: {
      root: {
        className:
          "flex h-8 w-8 items-center justify-center rounded-none border-0 border-l border-white/20 p-2 text-xs !text-white",
      },
    },
    panel: ({ props }: { props: { inline?: boolean } }) => ({
      className: classNames(
        "!w-68 !min-w-68 rounded-lg bg-white p-1 text-xs text-slate-700",
        props.inline
          ? "inline-block overflow-x-auto border border-gray-300"
          : "absolute border-0 shadow-md",
      ),
    }),
    header: {
      className:
        "m-0 flex items-center justify-between rounded-t-lg border-b border-gray-300 bg-white p-1 font-semibold text-gray-700",
    },
    previousButton: {
      className:
        "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-transparent text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-700",
    },
    nextButton: {
      className:
        "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-transparent text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-700",
    },
    title: "mx-auto leading-7",
    monthTitle: {
      className:
        "mr-1 p-1 font-semibold text-gray-700 transition hover:text-blue-500",
    },
    yearTitle: {
      className:
        "p-1 font-semibold text-gray-700 transition hover:text-blue-500",
    },
    table: { className: "my-1 w-full border-collapse" },
    tableHeaderCell: "p-1",
    day: "p-1",
    dayLabel: ({
      context,
    }: {
      context: { disabled?: boolean; selected?: boolean };
    }) => ({
      className: classNames(
        "relative mx-auto flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-transparent transition-shadow focus:outline-none",
        context.disabled ? "cursor-default opacity-60" : "cursor-pointer",
        context.selected && !context.disabled
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-transparent text-gray-600 hover:bg-gray-200",
      ),
    }),
    timePicker: {
      className:
        "flex items-center justify-center border-t border-solid border-gray-300 p-1",
    },
    separatorContainer: "flex flex-col items-center px-1",
    hourPicker: "flex flex-col items-center px-1",
    minutePicker: "flex flex-col items-center px-1",
    ampmPicker: "flex flex-col items-center px-1",
    incrementButton: {
      className:
        "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-transparent text-gray-600 transition-colors hover:bg-gray-200",
    },
    decrementButton: {
      className:
        "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-transparent text-gray-600 transition-colors hover:bg-gray-200",
    },
    buttonbar: {
      className:
        "flex items-center justify-between gap-2 border-t border-gray-300 p-2",
    },
    todayButton: {
      root: {
        className:
          "h-8 rounded-md px-3 py-1.5 text-xs items-center inline-flex",
      },
      label: { className: "text-xs font-semibold" },
    },
    clearButton: {
      root: {
        className:
          "h-8 rounded-md px-3 py-1.5 text-xs items-center inline-flex",
      },
      label: { className: "text-xs font-semibold" },
    },
  },

  // Editor
  editor: {
    ...Tailwind.editor,
    toolbar: {
      className:
        "rounded-t-lg border border-gray-300 bg-gray-100 px-2 py-1 font-sans",
    },
    content: {
      className:
        "rounded-b-lg border border-t-0 border-gray-300 bg-white text-slate-700",
    },
  },

  // Dropdown
  dropdown: {
    ...Tailwind.dropdown,
    root: ({ props }: { props: { disabled?: boolean } }) => ({
      className: classNames(
        "relative inline-flex w-full cursor-pointer select-none items-center rounded-lg border border-gray-300 bg-white text-slate-700 transition-colors hover:border-blue-500 focus:outline-none focus:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)]",
        { "pointer-events-none cursor-default opacity-60": props.disabled },
      ),
    }),
    input: ({ props }: { props: { showClear?: boolean } }) => ({
      className: classNames(
        "relative block flex flex-auto cursor-pointer overflow-hidden overflow-ellipsis whitespace-nowrap rounded-lg border-0 bg-transparent p-3 font-sans text-base text-slate-700 transition focus:outline-none focus:shadow-none",
        { "pr-7": props.showClear },
      ),
    }),
    trigger: {
      className:
        "flex w-10 shrink-0 items-center justify-center rounded-r-lg bg-transparent text-slate-500",
    },
    header: {
      className:
        "sticky top-0 z-10 mt-0 border-b border-slate-200 bg-slate-50/95 p-2 text-slate-700 backdrop-blur-sm",
    },
    panel: {
      className:
        "mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(2,11,29,0.28)]",
    },
    transition: {
      timeout: 150,
      classNames: {
        enter: "scale-95 opacity-0",
        enterActive: "scale-100 opacity-100 transition duration-150 ease-out",
        exit: "scale-100 opacity-100",
        exitActive: "scale-95 opacity-0 transition duration-100 ease-in",
      },
    },
    wrapper: {
      className:
        "max-h-52 overflow-auto bg-white text-slate-700 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent",
    },
    list: { className: "m-0 list-none p-1.5" },
    item: ({
      context,
    }: {
      context: { disabled?: boolean; focused?: boolean; selected?: boolean };
    }) => ({
      className: classNames(
        "relative m-0 flex cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg border-0 px-3 py-2 text-sm font-normal transition-colors",
        context.selected
          ? "bg-blue-50 font-medium text-blue-700 ring-1 ring-inset ring-blue-100"
          : context.focused
            ? "bg-slate-100 text-slate-950"
            : "text-slate-700 hover:bg-slate-50",
        { "pointer-events-none cursor-default opacity-60": context.disabled },
      ),
    }),
    filterContainer: { className: "relative p-2" },
    filterInput: {
      className:
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
    },
    filterIcon: {
      className:
        "absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400",
    },
    emptyMessage: {
      className: "px-3 py-2 text-sm text-slate-500",
    },
  },

  // MultiSelect
  multiselect: {
    root: {
      className:
        "inline-flex w-full cursor-pointer items-center rounded-lg border border-gray-300 bg-white text-slate-700 transition-colors hover:border-blue-500 focus:outline-none focus:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)]",
    },
    labelContainer: {
      className: "overflow-hidden flex flex-auto cursor-pointer",
    },
    label: { className: "px-3 py-2 text-sm text-slate-700" },
    token: {
      className:
        "px-2 mr-2 bg-white/10 text-white/80 rounded-full inline-flex items-center bg-[image:var(--brand-gradient)]",
    },
    removeTokenIcon: {
      className: "ml-1 cursor-pointer text-white/80 hover:text-white",
    },
    trigger: {
      className:
        "flex w-10 shrink-0 items-center justify-center text-slate-500",
    },
    dropdownIcon: { className: "w-4 h-4" },
    header: {
      className:
        "mt-0 flex justify-between border-b border-slate-200 bg-slate-50 p-2 text-slate-700",
    },
    panel: {
      className:
        "mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(2,11,29,0.28)]",
    },
    wrapper: {
      className:
        "max-h-52 overflow-auto bg-white text-slate-700 [scrollbar-color:#94a3b8_transparent] [scrollbar-width:thin]",
    },
    list: { className: "list-none p-1 m-0" },
    itemGroup: {
      className:
        "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500",
    },
    item: ({ context }: { context?: { checked?: boolean } }) => ({
      className: classNames(
        "cursor-pointer font-normal whitespace-nowrap px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
        context?.checked
          ? "bg-blue-50 text-blue-700"
          : "text-slate-700 hover:bg-slate-100",
      ),
    }),
    checkboxContainer: { className: "mr-2" },
    checkbox: {
      root: {
        className: "inline-flex items-center justify-center w-5 h-5",
      },
      icon: { className: "text-cyan-400 text-xs" },
    },
    filterContainer: { className: "relative p-2" },
    filterInput: {
      className:
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
    },
    filterIcon: {
      className: "absolute right-5 top-1/2 -translate-y-1/2 text-slate-400",
    },
    emptyMessage: {
      className: "px-3 py-2 text-sm text-slate-500",
    },
  },
  checkbox: {
    root: {
      className: "relative",
    },
    input: {
      className:
        "h-4 w-4 appearance-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer",
    },
    box: {
      className: "h-4 w-4 rounded border border-white/10 bg-white/5",
    },
    icon: { className: "text-cyan-400 text-xs" },
  },
  radiobutton: {
    input: { className: "h-4 w-4 hidden" },
    box: {
      className:
        "h-4 w-4 rounded-full border border-white/10 bg-white/5 flex items-center justify-center",
    },
    icon: ({ props }: { props: RadioButtonProps }) => ({
      className: classNames(
        "rounded-full w-2 h-2",
        props?.checked ? "bg-cyan-400" : "text-white/50",
      ),
    }),
  },
  autocomplete: {
    ...Tailwind.autocomplete,
    input: ({ props }: { props: AutoCompleteProps }) => ({
      root: {
        className: classNames(
          "m-0",
          "w-full",
          "transition-colors duration-200 appearance-none rounded-lg",
          { "rounded-tr-none rounded-br-none": props.dropdown },
          {
            "font-sans text-base text-gray-700 dark:text-white/80 bg-white dark:bg-gray-900 p-2 text-xs border border-gray-300 dark:border-blue-900/40 focus:outline-offset-0 focus:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)] dark:focus:shadow-[0_0_0_0.2rem_rgba(147,197,253,0.5)] hover:border-blue-500 focus:outline-none":
              !props.multiple,
            "font-sans text-base text-gray-700 dark:text-white/80 border-0 outline-none bg-transparent m-0 p-0 shadow-none rounded-none w-full":
              props.multiple,
          },
        ),
      },
    }),
  },
  dialog: {
    root: {
      className: "bg-brand-dark border border-white/10 rounded-2xl shadow-2xl",
    },
    header: {
      className:
        "p-3 border-b flex flex-row justify-between border-white/10 text-zinc-100 bg-brand-dark mt-0 rounded-tl-xl rounded-tr-xl",
    },
    footer: {
      className: "flex justify-end gap-2 p-4 border-t border-white/10",
    },
    content: {
      className: "p-6",
    },
    mask: {
      className: "bg-black/50",
    },
  },
  // InputNumber
  inputnumber: {
    ...Tailwind.inputnumber,
    root: {
      className: "inline-flex w-full",
    },
    input: {
      root: ({
        props,
      }: {
        props: { showButtons?: boolean; buttonLayout?: string };
      }) => ({
        className: classNames(
          "w-full appearance-none rounded-lg border border-gray-300 bg-white p-3 font-sans text-base text-slate-700 transition-colors hover:border-blue-500 focus:border-blue-400 focus:outline-none focus:shadow-[0_0_0_0.2rem_rgba(191,219,254,1)]",
          {
            "rounded-r-none":
              props.showButtons && props.buttonLayout === "stacked",
          },
        ),
      }),
    },
  },

  // Chips
  chips: {
    ...Tailwind.chips,
    root: {
      className: "w-full",
    },
    container: {
      className:
        "m-0 flex min-h-10 w-full cursor-text list-none flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-brand-dark px-3 py-2 text-white transition-colors hover:border-white/30 focus-within:border-brand-blue/70 focus-within:shadow-[0_0_0_3px_rgba(41,184,255,0.12)]",
    },
    inputToken: {
      className:
        "inline-flex min-w-32 flex-1 items-center py-0.5 text-white/80",
    },
    input: {
      className:
        "m-0 w-full cursor-text border-0 bg-transparent p-0 text-xs text-white/80 shadow-none outline-none placeholder:text-zinc-500",
    },
    token: {
      className:
        "inline-flex items-center gap-1.5 rounded-full border-0 bg-[image:var(--brand-gradient)] px-2.5 py-1 text-xs font-medium text-white shadow-sm before:text-white/60 before:content-['#']",
    },
    removeTokenIcon: {
      className:
        "ml-0.5 h-4 w-4 cursor-pointer rounded-full p-0.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none",
    },
  },
  // DataTable
  datatable: {
    root: {
      className: "relative",
    },
    header: {
      className:
        "bg-brand-dark text-zinc-100 border-b border-white/10 p-4 rounded-t-xl",
    },
    table: {
      className: "w-full border-spacing-0",
    },
    thead: {
      className: "bg-brand-dark",
    },
    headerRow: {
      className: "",
    },
    column: {
      headerCell: {
        className:
          "text-zinc-300 font-semibold text-sm px-4 py-3 text-left bg-brand-dark border-b border-white/10",
      },
      headerContent: {
        className: "flex flex-row items-center",
      },
      headerTitle: {
        className: "font-semibold",
      },
      sortIcon: {
        className: "text-zinc-400 ml-1",
      },
      columnResizer: {
        className: "w-2 h-full cursor-col-resize",
      },
      bodyCell: {
        className: "text-zinc-200 text-sm px-4 py-3 border-b border-white/10",
      },
    },
    tbody: {
      className: "bg-brand-dark/50",
    },
    bodyRow: {
      className: "hover:bg-white/5 transition-colors",
    },
    footerRow: {
      className: "",
    },
    footerCell: {
      className:
        "text-zinc-300 text-sm px-4 py-3 border-t border-white/10 bg-brand-dark",
    },
    emptyMessage: {
      className: "text-zinc-400 px-4 py-8 text-center text-sm",
    },
    loadingOverlay: {
      className:
        "absolute inset-0 bg-brand-dark/60 flex items-center justify-center z-10",
    },
    loadingIcon: {
      className: "w-8 h-8 text-cyan-400 animate-spin",
    },
    footer: {
      className:
        "bg-brand-dark text-zinc-300 border-t border-white/10 p-4 rounded-b-xl",
    },
    paginator: {
      root: {
        className:
          "rounded-b-xl rounded-t-none flex items-center flex-wrap gap-2 bg-brand-dark text-zinc-300 px-4 py-3 border-t border-white/10",
      },
      firstPageButton: {
        className:
          "w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors",
      },
      prevPageButton: {
        className:
          "w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors",
      },
      nextPageButton: {
        className:
          "w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors",
      },
      lastPageButton: {
        className:
          "w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors",
      },
      pageButton: {
        className:
          "w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors",
      },
      current: {
        className: "text-zinc-100 font-medium",
      },
      RPPDropdown: {
        root: {
          className:
            "inline-flex relative cursor-pointer bg-brand-dark border border-white/10 rounded-lg text-white/80 h-8 mx-2 w-auto",
        },
        input: {
          className:
            "text-white/80 text-xs py-1.5 px-2 bg-transparent flex-auto w-[1%] cursor-pointer border-0 focus:outline-none",
        },
        trigger: {
          className:
            "flex items-center justify-center shrink-0 text-zinc-400 w-8 rounded-r-md",
        },
        panel: {
          className:
            "bg-brand-dark border border-white/10 rounded-lg shadow-lg",
        },
        wrapper: { className: "bg-brand-dark" },
        list: { className: "list-none p-1 m-0" },
        item: {
          className:
            "text-zinc-100 cursor-pointer font-normal whitespace-nowrap px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs",
        },
      },
      JTPInput: {
        root: {
          className: "inline-flex mx-2",
        },
        input: {
          root: {
            className:
              "w-12 text-white/80 text-xs py-1.5 px-2 bg-brand-dark border border-white/10 rounded-lg focus:outline-none",
          },
        },
      },
    },
  },

  // Badge
  badge: {
    ...Tailwind.badge,
    root: ({ props }: { props: Record<string, unknown> }) => ({
      className: classNames(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
        {
          "bg-cyan-500/20 text-cyan-300": !props.severity && !props.value,
          "bg-emerald-500/20 text-emerald-300": props.severity === "success",
          "bg-blue-500/20 text-blue-300": props.severity === "info",
          "bg-orange-500/20 text-orange-300": props.severity === "warning",
          "bg-red-500/20 text-red-300": props.severity === "danger",
          "bg-gray-500/20 text-gray-300": props.severity === "secondary",
          "bg-purple-500/20 text-purple-300": props.severity === "help",
        },
      ),
    }),
  },

  // ConfirmDialog
  confirmdialog: {
    root: {
      className: "bg-brand-dark border border-white/10 rounded-2xl shadow-2xl",
    },
    content: {
      className: "p-6",
    },
    icon: {
      className: "text-orange-400 mr-2",
    },
    message: {
      className: "text-zinc-300 text-sm",
    },
    footer: {
      className: "flex justify-end gap-2 p-4 border-t border-white/10",
    },
    rejectButton: {
      outlined: true,
      size: "small",
    },
    acceptButton: {
      severity: "danger",
      size: "small",
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
            "text-white bg-brand-aqua border border-brand-aqua hover:bg-brand-blue hover:border-brand-blue focus:shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(30,216,240,0.5)] bg-[image:var(--brand-gradient)]":
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
        pt: customTailwind as never,
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

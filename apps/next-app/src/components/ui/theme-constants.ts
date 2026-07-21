export const selectSmall = {
  root: {
    className: "h-8 rounded-lg",
  },
  input: {
    className: "px-3 py-1.5 text-xs",
  },
  trigger: {
    className: "w-8",
  },
  filterInput: {
    className: "py-1.5 text-xs",
  },
  item: {
    className: "px-3 py-1.5 text-xs",
  },
};

export const inputNumberSmall = {
  root: { className: "h-8 w-full" },
  input: {
    root: {
      className: "h-8 px-3 py-1.5 text-xs",
    },
  },
};

export const selectSmallDark = {
  ...selectSmall,
  root: {
    className:
      "h-8 rounded-lg border-white/10 bg-brand-dark text-white/80 hover:border-white/20",
  },
  input: {
    className: "px-3 py-1.5 text-xs text-white/80",
  },
  trigger: {
    className: "w-8 text-zinc-400",
  },
};

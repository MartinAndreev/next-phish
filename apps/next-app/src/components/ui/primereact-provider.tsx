"use client";

import { PrimeReactProvider } from "primereact/api";
import Tailwind from "primereact/passthrough/tailwind";
import { twMerge } from "tailwind-merge";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrimeReactProvider
      value={{
        unstyled: true,
        pt: Tailwind,
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

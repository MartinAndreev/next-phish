"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

export type CampaignCatalogKind =
  | "emailTemplates"
  | "pages"
  | "sendingProfiles";

export interface CatalogPageState {
  input: string;
  search: string;
  offset: number;
  limit: number;
}

interface CampaignCatalogState {
  emailTemplates: CatalogPageState;
  pages: CatalogPageState;
  sendingProfiles: CatalogPageState;
}

type Action =
  | { type: "INPUT"; kind: CampaignCatalogKind; value: string }
  | { type: "SEARCH"; kind: CampaignCatalogKind; value: string }
  | {
      type: "PAGE";
      kind: CampaignCatalogKind;
      offset: number;
      limit: number;
    };

const initialPage: CatalogPageState = {
  input: "",
  search: "",
  offset: 0,
  limit: 6,
};

const initialState: CampaignCatalogState = {
  emailTemplates: { ...initialPage },
  pages: { ...initialPage },
  sendingProfiles: { ...initialPage, limit: 100 },
};

function reducer(
  state: CampaignCatalogState,
  action: Action,
): CampaignCatalogState {
  if (action.type === "INPUT")
    return {
      ...state,
      [action.kind]: { ...state[action.kind], input: action.value },
    };
  if (action.type === "SEARCH")
    return {
      ...state,
      [action.kind]: {
        ...state[action.kind],
        search: action.value,
        offset: 0,
      },
    };
  return {
    ...state,
    [action.kind]: {
      ...state[action.kind],
      offset: action.offset,
      limit: action.limit,
    },
  };
}

export function useCampaignCatalogState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timeoutRefs = useRef<
    Partial<Record<CampaignCatalogKind, ReturnType<typeof setTimeout>>>
  >({});

  useEffect(
    () => () => {
      for (const timeout of Object.values(timeoutRefs.current))
        if (timeout) clearTimeout(timeout);
    },
    [],
  );

  const setSearch = useCallback((kind: CampaignCatalogKind, value: string) => {
    dispatch({ type: "INPUT", kind, value });
    const current = timeoutRefs.current[kind];
    if (current) clearTimeout(current);
    timeoutRefs.current[kind] = setTimeout(
      () => dispatch({ type: "SEARCH", kind, value: value.trim() }),
      300,
    );
  }, []);

  const setPage = useCallback(
    (kind: CampaignCatalogKind, offset: number, limit: number) =>
      dispatch({ type: "PAGE", kind, offset, limit }),
    [],
  );

  return { state, setSearch, setPage };
}

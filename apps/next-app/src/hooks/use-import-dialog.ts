import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { trpc } from "@/src/lib/trpc";

interface PreviousImport {
  id: string;
  url: string;
  finalUrl: string | null;
  status: string;
  includeAssets: boolean;
  html: string | null;
  assetDownloaded: number;
  fileCount: number;
  createdAt: Date;
}

interface ImportState {
  url: string;
  includeAssets: boolean;
  importing: boolean;
  error: string;
  jobId: string | null;
  progress: {
    status: string;
    discovered: number;
    downloaded: number;
    failed: number;
  } | null;
}

type ImportAction =
  | { type: "SET_URL"; url: string }
  | { type: "SET_INCLUDE_ASSETS"; value: boolean }
  | { type: "IMPORT_START"; jobId: string }
  | { type: "IMPORT_PROGRESS"; progress: ImportState["progress"] }
  | { type: "IMPORT_COMPLETE" }
  | { type: "IMPORT_ERROR"; error: string }
  | { type: "RESET" };

const initialState: ImportState = {
  url: "",
  includeAssets: false,
  importing: false,
  error: "",
  jobId: null,
  progress: null,
};

function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "SET_URL":
      return { ...state, url: action.url, error: "" };
    case "SET_INCLUDE_ASSETS":
      return { ...state, includeAssets: action.value };
    case "IMPORT_START":
      return { ...state, importing: true, jobId: action.jobId, error: "" };
    case "IMPORT_PROGRESS":
      return { ...state, progress: action.progress };
    case "IMPORT_COMPLETE":
      return initialState;
    case "IMPORT_ERROR":
      return {
        ...state,
        importing: false,
        jobId: null,
        progress: null,
        error: action.error,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface UseImportDialogOptions {
  t: (key: string) => string;
  onImportComplete: (html: string) => void;
  onHide: () => void;
}

export function useImportDialog({
  t,
  onImportComplete,
  onHide,
}: UseImportDialogOptions) {
  const [state, dispatch] = useReducer(importReducer, initialState);
  const pollingRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const importMutation = trpc.page.importFromUrl.useMutation();

  const { data: previousImports } = trpc.page.listImports.useQuery(
    { search: searchQuery || undefined, limit: 20 },
    { staleTime: 10000 },
  );

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      pollingRef.current = true;
      const maxAttempts = 120;

      for (let i = 0; i < maxAttempts; i++) {
        if (!pollingRef.current) return;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          const job = await utils.client.job.getById.query({ id: jobId });

          if (job?.status === "COMPLETED") {
            const output = job.output as { html?: string } | null;
            if (output?.html) {
              onImportComplete(output.html);
            }
            pollingRef.current = false;
            dispatch({ type: "IMPORT_COMPLETE" });
            onHide();
            return;
          }

          if (job?.status === "FAILED") {
            pollingRef.current = false;
            dispatch({
              type: "IMPORT_ERROR",
              error: t("pages.importWebsiteError"),
            });
            return;
          }

          if (job?.progress) {
            const progress = job.progress as {
              status: string;
              discovered: number;
              downloaded: number;
              failed: number;
            };
            dispatch({ type: "IMPORT_PROGRESS", progress });
          }
        } catch {
          // continue polling
        }
      }

      pollingRef.current = false;
      dispatch({
        type: "IMPORT_ERROR",
        error: t("pages.importWebsiteError"),
      });
    },
    [utils, t, onImportComplete, onHide],
  );

  useEffect(() => {
    return () => {
      pollingRef.current = false;
    };
  }, []);

  async function handleImport(url: string, includeAssets: boolean) {
    try {
      const result = await importMutation.mutateAsync({
        url,
        includeAssets,
      });
      dispatch({ type: "IMPORT_START", jobId: result.jobId });

      if (!includeAssets) {
        const job = await utils.client.job.getById.query({
          id: result.jobId,
        });
        if (job?.output) {
          const output = job.output as { html?: string };
          if (output.html) {
            onImportComplete(output.html);
          }
        }
        dispatch({ type: "IMPORT_COMPLETE" });
        onHide();
      } else {
        pollJobStatus(result.jobId);
      }
    } catch (e) {
      dispatch({
        type: "IMPORT_ERROR",
        error: e instanceof Error ? e.message : t("pages.importWebsiteError"),
      });
    }
  }

  function handleSelectPrevious(imp: PreviousImport) {
    if (imp.html) {
      onImportComplete(imp.html);
      dispatch({ type: "IMPORT_COMPLETE" });
      onHide();
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleHide() {
    pollingRef.current = false;
    dispatch({ type: "RESET" });
    onHide();
  }

  return {
    state,
    dispatch,
    previousImports: previousImports ?? [],
    handleImport,
    handleSelectPrevious,
    handleSearch,
    handleHide,
  };
}

export type { PreviousImport, ImportState };

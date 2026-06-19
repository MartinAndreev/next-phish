"use client";

import { useReducer } from "react";

type Step =
  | "idle"
  | "password-enable-totp"
  | "setup"
  | "done"
  | "password-disable"
  | "password-enable-otp";

type FormStatus =
  | { type: "idle"; message: "" }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

interface TwoFactorState {
  step: Step;
  status: FormStatus;
  totpUri: string;
  backupCodes: string[];
  verifyCode: string;
  password: string;
}

type TwoFactorAction =
  | { type: "SET_PASSWORD"; password: string }
  | { type: "SET_VERIFY_CODE"; code: string }
  | { type: "SET_ERROR"; message: string }
  | { type: "SETUP_TOTP"; totpUri: string; backupCodes: string[] }
  | { type: "ENABLE_TOTP" }
  | { type: "ENABLE_OTP" }
  | { type: "CONFIRM_DISABLE" }
  | { type: "COMPLETE"; message: string }
  | { type: "DISMISS_DONE" }
  | { type: "RESET" };

const initialState: TwoFactorState = {
  step: "idle",
  status: { type: "idle", message: "" },
  totpUri: "",
  backupCodes: [],
  verifyCode: "",
  password: "",
};

function twoFactorReducer(
  state: TwoFactorState,
  action: TwoFactorAction,
): TwoFactorState {
  switch (action.type) {
    case "SET_PASSWORD":
      return { ...state, password: action.password };
    case "SET_VERIFY_CODE":
      return { ...state, verifyCode: action.code };
    case "SET_ERROR":
      return { ...state, status: { type: "error", message: action.message } };
    case "SETUP_TOTP":
      return {
        ...state,
        totpUri: action.totpUri,
        backupCodes: action.backupCodes,
        step: "setup",
      };
    case "ENABLE_TOTP":
      return {
        ...state,
        step: "password-enable-totp",
        status: { type: "idle", message: "" },
      };
    case "ENABLE_OTP":
      return {
        ...state,
        step: "password-enable-otp",
        status: { type: "idle", message: "" },
      };
    case "CONFIRM_DISABLE":
      return {
        ...state,
        step: "password-disable",
        status: { type: "idle", message: "" },
      };
    case "COMPLETE":
      return {
        ...initialState,
        step: "done",
        status: { type: "success", message: action.message },
      };
    case "DISMISS_DONE":
      return initialState;
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useTwoFactorState() {
  const [state, dispatch] = useReducer(twoFactorReducer, initialState);

  return {
    state,
    setPassword: (password: string) =>
      dispatch({ type: "SET_PASSWORD", password }),
    setVerifyCode: (code: string) =>
      dispatch({ type: "SET_VERIFY_CODE", code }),
    setError: (message: string) => dispatch({ type: "SET_ERROR", message }),
    setupTotp: (totpUri: string, backupCodes: string[]) =>
      dispatch({ type: "SETUP_TOTP", totpUri, backupCodes }),
    enableTotp: () => dispatch({ type: "ENABLE_TOTP" }),
    enableOtp: () => dispatch({ type: "ENABLE_OTP" }),
    confirmDisable: () => dispatch({ type: "CONFIRM_DISABLE" }),
    complete: (message: string) => dispatch({ type: "COMPLETE", message }),
    dismissDone: () => dispatch({ type: "DISMISS_DONE" }),
    reset: () => dispatch({ type: "RESET" }),
  } as const;
}

import { z } from "zod";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "OUTSIDE_EDIT_WINDOW"
  | "FUTURE_DATE"
  | "LOCKED"
  | "INTERNAL";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> };
    };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, message: string): ActionResult<never> {
  return { ok: false, error: { code, message } };
}

export function validationError(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: {
      code: "VALIDATION",
      message: "errors.validation",
      fieldErrors: error.flatten().fieldErrors,
    },
  };
}

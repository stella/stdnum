import type { StdnumError, ValidateResult } from "../types";

/** Create an error ValidateResult. */
export const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

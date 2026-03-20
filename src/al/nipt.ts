/**
 * NIPT (Numri i Identifikimit për Personin e Tatueshëm,
 * Albanian tax number).
 *
 * 10 characters: a letter (A-M) indicating the decade or
 * birth decade, 8 digits encoding year/month/day/serial,
 * and a trailing check letter. The check digit algorithm
 * is undocumented.
 *
 * @see https://www.tatime.gov.al/eng/c/4/103/business-lifecycle
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const NIPT_RE = /^[A-M]\d{8}[A-Z]$/;

const compact = (value: string): string => {
  let v = clean(value, " ").toUpperCase().trim();
  if (v.startsWith("(AL)")) {
    v = v.slice(4);
  } else if (v.startsWith("AL")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Albanian NIPT must be 10 characters",
    );
  }
  if (!NIPT_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Albanian NIPT must be letter + 8 digits + letter"
        + " (first letter A-M)",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Albanian NIPT (tax identification number). */
const nipt: Validator = {
  name: "Albanian Tax Number",
  localName:
    "Numri i Identifikimit për Personin e Tatueshëm",
  abbreviation: "NIPT",
  country: "AL",
  entityType: "any",
  examples: ["J91402501L", "K22218003V"] as const,
  compact,
  format,
  validate,
};

export default nipt;
export { compact, format, validate };

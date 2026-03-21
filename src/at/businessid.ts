/**
 * Firmenbuchnummer (Austrian company register number).
 *
 * Digits followed by a single trailing letter.
 * Optional "FN" prefix. No checksum.
 *
 * @see https://www.justiz.gv.at/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const FN_RE = /^\d+[a-z]$/i;

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.slice(0, 2).toUpperCase() === "FN") {
    v = v.slice(2);
  }
  return v.toLowerCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 2) {
    return err(
      "INVALID_LENGTH",
      "Austrian Firmenbuchnummer is too short",
    );
  }
  if (!FN_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Austrian Firmenbuchnummer must be digits" +
        " followed by a letter",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `FN ${compact(value)}`;

/** Austrian Company Register Number. */
const businessid: Validator = {
  name: "Austrian Company Register Number",
  localName: "Firmenbuchnummer",
  abbreviation: "FN",
  country: "AT",
  entityType: "company",
  sourceUrl: "https://www.justiz.gv.at/",
  examples: ["122119m"] as const,
  compact,
  format,
  validate,
};

export default businessid;
export { compact, format, validate };

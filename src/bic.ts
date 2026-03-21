/**
 * BIC (Business Identifier Code).
 *
 * ISO 9362. 8 or 11 character code identifying
 * financial institutions. Format:
 * [A-Z]{4} (institution) + [A-Z]{2} (country) +
 * [0-9A-Z]{2} (location) + [0-9A-Z]{3} (branch,
 * optional).
 *
 * @see https://www.swift.com/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "./types";

const BIC_RE =
  /^[A-Z]{4}[A-Z]{2}[0-9A-Z]{2}([0-9A-Z]{3})?$/;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8 && v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "BIC must be 8 or 11 characters",
    );
  }
  if (!BIC_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "BIC must be 8 or 11 alphanumeric characters",
    );
  }
  // Country code at positions 4-5 is already
  // validated as [A-Z]{2} by the regex above.
  // SWIFT accepts all ISO 3166-1 alpha-2 codes
  // plus XK (Kosovo); we don't restrict further.
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 11) {
    return `${v.slice(0, 4)} ${v.slice(4, 6)} ${v.slice(6, 8)} ${v.slice(8)}`;
  }
  return `${v.slice(0, 4)} ${v.slice(4, 6)} ${v.slice(6)}`;
};

/** Business Identifier Code (SWIFT/BIC). */
const bic: Validator = {
  name: "Business Identifier Code",
  localName: "Business Identifier Code",
  abbreviation: "BIC",
  aliases: ["BIC", "SWIFT", "BIC/SWIFT"] as const,
  candidatePattern:
    "[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?",
  entityType: "company",
  sourceUrl: "https://www.swift.com/",
  examples: ["DEUTDEFF", "DEUTDEFF500"] as const,
  compact,
  format,
  validate,
};

export default bic;
export { compact, format, validate };

/**
 * UTR (Unique Taxpayer Reference).
 *
 * UK 10-digit tax reference number. The first
 * digit is a check digit computed using a
 * weighted sum with lookup table.
 *
 * @see https://www.gov.uk/find-utr-number
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [6, 7, 8, 9, 10, 5, 4, 3, 2] as const;
const CHECK_LOOKUP = "21987654321";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "UK UTR must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "UK UTR must contain only digits",
    );
  }
  const sum = weightedSum(v.slice(1), WEIGHTS, 11);
  const expected = CHECK_LOOKUP[sum];
  if (expected !== v[0]) {
    return err(
      "INVALID_CHECKSUM",
      "UK UTR check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 5)} ${v.slice(5)}`;
};

/** Generate a random valid UK UTR. */
const generate = (): string => { for (;;) { const c = randomDigits(10); if (validate(c).valid) return c; } };

/** UK Unique Taxpayer Reference. */
const utr: Validator = {
  name: "UK Unique Taxpayer Reference",
  localName: "Unique Taxpayer Reference",
  abbreviation: "UTR",
  country: "GB",
  entityType: "any",
  sourceUrl: "https://www.gov.uk/find-utr-number",
  examples: ["1955839661"] as const,
  compact,
  format,
  validate,
  generate,
};

export default utr;
export { compact, format, validate, generate };

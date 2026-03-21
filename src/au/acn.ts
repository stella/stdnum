/**
 * ACN (Australian Company Number).
 *
 * 9-digit identifier. Weights [8,7,6,5,4,3,2,1]
 * applied to the first 8 digits; check digit is
 * (10 - sum % 10) % 10.
 *
 * @see https://en.wikipedia.org/wiki/Australian_Company_Number
 * @see https://asic.gov.au/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "ACN must contain only digits",
    );
  }
  if (v.length !== 9) {
    return err("INVALID_LENGTH", "ACN must be 9 digits");
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(v[i]) * WEIGHTS[i];
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(v[8])) {
    return err(
      "INVALID_CHECKSUM",
      "ACN check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
  }
  return v;
};

/** Australian Company Number. */
const acn: Validator = {
  name: "Australian Company Number",
  localName: "Australian Company Number",
  abbreviation: "ACN",
  country: "AU",
  entityType: "company",
  sourceUrl: "https://asic.gov.au/",
  examples: ["004085616", "010499966"] as const,
  compact,
  format,
  validate,
};

export default acn;
export { compact, format, validate };

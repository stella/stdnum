/**
 * ABN (Australian Business Number).
 *
 * 11-digit identifier. Subtract 1 from the first
 * digit, then apply weights [10,1,3,5,7,9,11,13,
 * 15,17,19]; sum mod 89 must equal 0.
 *
 * @see https://en.wikipedia.org/wiki/Australian_Business_Number
 * @see https://abr.business.gov.au/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [
  10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19,
] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "ABN must contain only digits",
    );
  }
  if (v.length !== 11) {
    return err("INVALID_LENGTH", "ABN must be 11 digits");
  }

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let d = Number(v[i]);
    if (i === 0) d -= 1;
    sum += d * WEIGHTS[i];
  }
  if (sum % 89 !== 0) {
    return err("INVALID_CHECKSUM", "ABN checksum mismatch");
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 11) {
    return `${v.slice(0, 2)} ${v.slice(2, 5)} ${v.slice(5, 8)} ${v.slice(8)}`;
  }
  return v;
};

/** Australian Business Number. */
const abn: Validator = {
  name: "Australian Business Number",
  localName: "Australian Business Number",
  abbreviation: "ABN",
  country: "AU",
  entityType: "company",
  examples: ["83914571673", "51824753556"] as const,
  compact,
  format,
  validate,
};

export default abn;
export { compact, format, validate };

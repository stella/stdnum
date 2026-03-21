/**
 * Y-tunnus (Finnish Business ID).
 *
 * 8 digits. Weights [7,9,10,5,8,4,2,1],
 * sum % 11 === 0. Same algorithm as FI VAT.
 * Display format: NNNNNNN-C.
 *
 * @see https://www.ytj.fi/en/index/businessid.html
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1];

const compact = (value: string): string =>
  clean(value, " -/.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Finnish Y-tunnus must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Finnish Y-tunnus must contain only digits",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Finnish Y-tunnus check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 7)}-${v[7]}`;
};

/** Generate a random valid Finnish Y-tunnus. */
const generate = (): string => { for (;;) { const c = randomDigits(8); if (validate(c).valid) return c; } };

/** Finnish Business ID. */
const ytunnus: Validator = {
  name: "Finnish Business ID",
  localName: "Y-tunnus",
  abbreviation: "Y-tunnus",
  aliases: [
    "Y-tunnus",
    "yritystunnus",
    "FO-nummer",
  ] as const,
  candidatePattern: "\\d{7}-\\d",
  country: "FI",
  entityType: "company",
  sourceUrl: 
    "https://www.ytj.fi/en/index/businessid.html",
  examples: ["20774740"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ytunnus;
export { compact, format, validate, generate };

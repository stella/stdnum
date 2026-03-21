/**
 * ALV nro (Finnish VAT number).
 *
 * 8 digits. Weights [7,9,10,5,8,4,2,1],
 * sum % 11 === 0.
 *
 * @see https://www.vatify.eu/finland-vat-number.html
 * @see https://www.ytj.fi/en/index/businessid.html
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("FI") || v.startsWith("fi")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Finnish VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Finnish VAT number must contain only digits",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Finnish VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `FI${compact(value)}`;

/** Generate a random valid Finnish VAT number. */
const generate = (): string => { for (;;) { const c = randomDigits(8); if (validate(c).valid) return c; } };

/** Finnish VAT Number. */
const vat: Validator = {
  name: "Finnish VAT Number",
  localName: "Arvonlisäveronumero",
  abbreviation: "ALV nro",
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

export default vat;
export { compact, format, validate, generate };

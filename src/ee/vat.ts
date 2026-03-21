/**
 * KMKR (Estonian VAT number).
 *
 * 9 digits. Weights [3,7,1,3,7,1,3,7,1],
 * sum % 10 === 0.
 *
 * @see https://www.vatify.eu/estonia-vat-number.html
 * @see https://www.emta.ee/en
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("EE") || v.startsWith("ee")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Estonian VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Estonian VAT number must contain only digits",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 10);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Estonian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `EE${compact(value)}`;

/** Generate a random valid Estonian VAT number. */
const generate = (): string => { for (;;) { const c = randomDigits(9); if (validate(c).valid) return c; } };

/** Estonian VAT Number. */
const vat: Validator = {
  name: "Estonian VAT Number",
  localName: "Käibemaksukohustuslase number",
  abbreviation: "KMKR",
  aliases: [
    "käibemaksukohustuslase number",
    "KMKR",
  ] as const,
  candidatePattern: "EE\\d{9}",
  country: "EE",
  entityType: "company",
  sourceUrl: "https://www.emta.ee/en",
  examples: ["100931558"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

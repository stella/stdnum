/**
 * VAT (Maltese VAT number).
 *
 * 8 digits, no leading 0.
 * Weights [3,4,6,7,8,9,10,1], sum % 37 === 0.
 *
 * @see https://www.vatify.eu/malta-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/malta-tin.pdf
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const WEIGHTS = [3, 4, 6, 7, 8, 9, 10, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("MT") || v.startsWith("mt")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Maltese VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Maltese VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Maltese VAT number cannot start with 0",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 37);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Maltese VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `MT${compact(value)}`;

/** Generate a random valid Maltese VAT number. */
const generate = (): string => { for (;;) { const c = String(randomInt(1, 9)) + randomDigits(7); if (validate(c).valid) return c; } };

/** Maltese VAT Number. */
const vat: Validator = {
  name: "Maltese VAT Number",
  localName: "VAT Registration Number",
  abbreviation: "VAT",
  country: "MT",
  entityType: "company",
  sourceUrl: "https://cfr.gov.mt/",
  examples: ["11679112"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

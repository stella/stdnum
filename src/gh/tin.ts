/**
 * TIN (Tax Identification Number, Ghana).
 *
 * 11-character alphanumeric identifier. Structure:
 *   - Position 1: type prefix (P/C/G/Q/V)
 *   - Positions 2-3: always "00"
 *   - Positions 4-10: digits
 *   - Position 11: check digit (0-9 or X)
 *
 * Prefixes: P = individual, C = company,
 * G = government, Q = foreign mission,
 * V = public institution / trust.
 *
 * @see https://gra.gov.gh/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const FORMAT_RE = /^[PCGQV]00[0-9]{7}[0-9X]$/;

const compact = (value: string): string =>
  clean(value, " ").toUpperCase();

/**
 * Calculate the expected check digit.
 * Uses positions 1-9 (0-indexed) with weights 1-9,
 * mod 11. Returns "X" when the remainder is 10.
 */
const calcCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += i * Number(value[i]);
  }
  const check = sum % 11;
  return check === 10 ? "X" : String(check);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Ghanaian TIN must be exactly 11 characters",
    );
  }
  if (!FORMAT_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Ghanaian TIN must match [PCGQV]00 + " +
        "7 digits + check digit",
    );
  }
  if (v[10] !== calcCheckDigit(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Ghanaian TIN check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  compact(value);

/** Ghanaian Tax Identification Number. */
const tin: Validator = {
  name: "Ghanaian Tax Identification Number",
  localName: "Tax Identification Number",
  abbreviation: "TIN",
  aliases: [
    "TIN",
    "Tax Identification Number",
  ] as const,
  candidatePattern: "[A-Z]\\d{9,10}",
  country: "GH",
  entityType: "any",
  compact,
  format,
  validate,
  description:
    "Ghanaian tax identification number",
  sourceUrl: "https://gra.gov.gh/",
  lengths: [11] as const,
  examples: ["C0000803561"] as const,
};

export default tin;
export { compact, format, validate };

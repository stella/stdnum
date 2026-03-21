/**
 * PVM kodas (Lithuanian VAT number).
 *
 * 9 or 12 digits. 9-digit: d[7] must be 1.
 * 12-digit: d[10] must be 1. Weighted checksum
 * with fallback weights.
 *
 * @see https://www.vatify.eu/lithuania-vat-number.html
 * @see https://www.vmi.lt/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("LT") || v.startsWith("lt")) {
    v = v.slice(2);
  }
  return v;
};

const checksum = (v: string): boolean => {
  const n = v.length;
  let check = 0;
  for (let i = 0; i < n - 1; i++) {
    check += (1 + (i % 9)) * Number(v[i]);
  }
  check %= 11;
  if (check === 10) {
    check = 0;
    for (let i = 0; i < n - 1; i++) {
      check += (1 + ((i + 2) % 9)) * Number(v[i]);
    }
    check %= 11;
  }
  return check % 10 === Number(v[n - 1]);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Lithuanian VAT number must be 9 or 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Lithuanian VAT number must contain only digits",
    );
  }
  // Check the marker digit
  if (v.length === 9 && v[7] !== "1") {
    return err(
      "INVALID_COMPONENT",
      "Lithuanian 9-digit VAT: digit 8 must be 1",
    );
  }
  if (v.length === 12 && v[10] !== "1") {
    return err(
      "INVALID_COMPONENT",
      "Lithuanian 12-digit VAT: digit 11 must be 1",
    );
  }
  if (!checksum(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Lithuanian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `LT${compact(value)}`;

/** Generate a random valid Lithuanian VAT number. */
const generate = (): string => { for (;;) { const c = randomDigits(9); if (validate(c).valid) return c; } };

/** Lithuanian VAT Number. */
const vat: Validator = {
  name: "Lithuanian VAT Number",
  localName: "PVM mokėtojo kodas",
  abbreviation: "PVM kodas",
  aliases: [
    "PVM mokėtojo kodas",
    "PVM",
  ] as const,
  candidatePattern: "LT\\d{9,12}",
  country: "LT",
  entityType: "any",
  sourceUrl: "https://www.vmi.lt/",
  examples: ["119511515", "100001919017"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

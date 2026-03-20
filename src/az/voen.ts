/**
 * VÖEN (Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi,
 * Azerbaijani tax identification number).
 *
 * 10 digits: TTSSSSSSCD where:
 *   - TT = territorial unit code
 *   - SSSSSS = serial number
 *   - C = check digit (weighted sum mod 11)
 *   - D = legal status (1=legal person, 2=natural person)
 *
 * Ported from python-stdnum az.voen module.
 *
 * @see https://www.taxes.gov.az/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

/** Weights for check digit computation (positions 0-7). */
const WEIGHTS = [4, 1, 8, 6, 2, 7, 5, 3] as const;

/**
 * Compact: strip spaces, prepend '0' if 9 digits.
 */
const compact = (value: string): string => {
  let number = clean(value, " ").trim();
  if (number.length === 9) {
    number = "0" + number;
  }
  return number;
};

/**
 * Calculate the check digit (position 8) using
 * weighted sum of the first 8 digits mod 11.
 */
const calcCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(value[i]);
  }
  return String(sum % 11);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Azerbaijani VÖEN must be 10 digits",
    );
  }

  if (!/^\d{10}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Azerbaijani VÖEN must contain only digits",
    );
  }

  const lastDigit = v[9]!;
  if (lastDigit !== "1" && lastDigit !== "2") {
    return err(
      "INVALID_COMPONENT",
      "VÖEN last digit must be 1 or 2",
    );
  }

  const expected = calcCheckDigit(v);
  if (v[8] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "VÖEN check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 10)}`;
};

/**
 * Azerbaijani tax identification number (VÖEN).
 *
 * Examples sourced from python-stdnum test suite.
 */
const voen: Validator = {
  name: "Azerbaijani Tax ID",
  localName:
    "Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi",
  abbreviation: "VÖEN",
  country: "AZ",
  entityType: "any",
  lengths: [10] as const,
  examples: ["1401555071", "1400057421"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://www.taxes.gov.az/",
};

export default voen;
export { compact, format, validate };

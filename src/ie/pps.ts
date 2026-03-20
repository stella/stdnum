/**
 * PPS (Personal Public Service Number).
 *
 * Irish personal identification number. 7 digits
 * followed by a check letter and an optional second
 * letter (new format). Uses a weighted sum with
 * alphabet "WABCDEFGHIJKLMNOPQRSTUV".
 *
 * @see https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const ALPHABET = "WABCDEFGHIJKLMNOPQRSTUV";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 8 || v.length > 9) {
    return err(
      "INVALID_LENGTH",
      "PPS must be 8 or 9 characters",
    );
  }

  const digits = v.slice(0, 7);
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "PPS must start with 7 digits",
    );
  }

  const checkLetter = v[7];
  const secondLetter = v.length >= 9 ? v[8] : undefined;

  // Compute weighted sum: weights 8..2 for digits
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(digits[i]) * (8 - i);
  }

  // New format: add 9 * index of 2nd letter
  if (secondLetter !== undefined && secondLetter !== "W") {
    const idx = ALPHABET.indexOf(secondLetter);
    if (idx === -1) {
      return err(
        "INVALID_FORMAT",
        "PPS second letter is invalid",
      );
    }
    sum += 9 * idx;
  }

  const remainder = sum % 23;
  const expected = ALPHABET[remainder];
  if (checkLetter !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "PPS check letter does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Irish Personal Public Service Number. */
const pps: Validator = {
  name: "Irish Personal ID",
  localName: "Personal Public Service Number",
  abbreviation: "PPS",
  country: "IE",
  entityType: "person",
  examples: ["6433435F"] as const,
  compact,
  format,
  validate,
};

export default pps;
export { compact, format, validate };

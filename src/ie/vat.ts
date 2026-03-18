/**
 * VAT (Irish VAT number).
 *
 * 8-9 characters, complex format with old and new
 * styles.
 *
 * @see https://www.vatify.eu/ireland-vat-number.html
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const ALPHABET = "WABCDEFGHIJKLMNOPQRSTUV";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("IE") || v.startsWith("ie")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const checkNew = (v: string): boolean => {
  // New format: 7 digits + check letter + optional
  // trailing letter (W or A-Z)
  const trailing = v.length === 9 ? v[8] : "W";
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += (8 - i) * Number(v[i]);
  }
  sum += 9 * ALPHABET.indexOf(trailing);
  const expected = ALPHABET[sum % 23];
  return v[7] === expected;
};

const checkOld = (v: string): boolean => {
  // Old format: digit + letter + 5 digits +
  // check letter (8 chars total).
  // Rearrange to 7-digit new-style layout:
  // 0 + d[2..6] + d[0]
  const rearranged = `0${v.slice(2, 7)}${v[0]}`;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += (8 - i) * Number(rearranged[i]);
  }
  const expected = ALPHABET[sum % 23];
  return v[7] === expected;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Irish VAT number must be 8 or 9 characters",
    );
  }

  // New format: 7 digits + letter [+ letter]
  if (isdigits(v.slice(0, 7)) && /^[A-Z]$/.test(v[7])) {
    if (v.length === 9 && !/^[A-Z+*]$/.test(v[8])) {
      return err(
        "INVALID_FORMAT",
        "Irish VAT trailing character must be a letter",
      );
    }
    if (!checkNew(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Irish VAT number check letter mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  // Old format: digit + letter + 5 digits + letter
  if (
    v.length === 8 &&
    /^\d$/.test(v[0]) &&
    /^[A-Z+*]$/.test(v[1]) &&
    isdigits(v.slice(2, 7)) &&
    /^[A-Z]$/.test(v[7])
  ) {
    if (!checkOld(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Irish VAT number check letter mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  return err(
    "INVALID_FORMAT",
    "Irish VAT number has invalid format",
  );
};

const format = (value: string): string =>
  `IE${compact(value)}`;

/** Irish VAT Number. */
const vat: Validator = {
  name: "Irish VAT Number",
  localName: "Value Added Tax Number",
  abbreviation: "VAT",
  country: "IE",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

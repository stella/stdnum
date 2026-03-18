/**
 * ИН по ДДС (Bulgarian VAT number).
 *
 * 9 or 10 digits with weighted checksum.
 *
 * @see https://www.vatify.eu/bulgaria-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/bulgaria-tin.pdf
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

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("BG") || v.startsWith("bg")) {
    v = v.slice(2);
  }
  return v;
};

const d = (v: string, i: number): number => Number(v[i]);

const validate9 = (v: string): boolean => {
  let check = 0;
  for (let i = 0; i < 8; i++) {
    check += d(v, i) * (i + 1);
  }
  check %= 11;
  if (check === 10) {
    check = 0;
    for (let i = 0; i < 8; i++) {
      check += d(v, i) * (i + 3);
    }
    check %= 11;
  }
  return check % 10 === d(v, 8);
};

/**
 * Validate a 10-digit EGN (personal code).
 * First 6 digits encode birth date (YYMMDD with month
 * offsets: +20 for 1800s, +40 for 2000s). Check digit
 * uses weights [2,4,8,5,10,9,7,3,6], sum % 11 % 10.
 */
const validateEgn = (v: string): boolean => {
  const year = d(v, 0) * 10 + d(v, 1);
  let month = d(v, 2) * 10 + d(v, 3);
  const day = d(v, 4) * 10 + d(v, 5);
  let fullYear = year + 1900;
  if (month > 40) {
    fullYear += 100;
    month -= 40;
  } else if (month > 20) {
    fullYear -= 100;
    month -= 20;
  }
  // Validate the birth date
  const date = new Date(fullYear, month - 1, day);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += weights[i] * d(v, i);
  }
  return (sum % 11) % 10 === d(v, 9);
};

/**
 * Validate a 10-digit PNF (foreigner personal number).
 * Weights [21,19,17,13,11,9,7,3,1], sum % 10.
 */
const validatePnf = (v: string): boolean => {
  const weights = [21, 19, 17, 13, 11, 9, 7, 3, 1];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += weights[i] * d(v, i);
  }
  return sum % 10 === d(v, 9);
};

/**
 * Validate a 10-digit "other" VAT number.
 * Weights [4,3,2,7,6,5,4,3,2], (11 - sum%11) % 11.
 */
const validateOther = (v: string): boolean => {
  const weights = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += weights[i] * d(v, i);
  }
  return (11 - (sum % 11)) % 11 === d(v, 9);
};

const validate10 = (v: string): boolean =>
  validateEgn(v) || validatePnf(v) || validateOther(v);

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Bulgarian VAT number must be 9 or 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Bulgarian VAT number must contain only digits",
    );
  }
  const valid =
    v.length === 9 ? validate9(v) : validate10(v);
  if (!valid) {
    return err(
      "INVALID_CHECKSUM",
      "Bulgarian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `BG${compact(value)}`;

/** Bulgarian VAT Number. */
const vat: Validator = {
  name: "Bulgarian VAT Number",
  localName: "ИН по ДДС",
  abbreviation: "ИН по ДДС",
  country: "BG",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

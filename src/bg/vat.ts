/**
 * ИН по ДДС (Bulgarian VAT number).
 *
 * 9 or 10 digits with weighted checksum.
 *
 * @see https://www.vatify.eu/bulgaria-vat-number.html
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

const validate10 = (v: string): boolean => {
  const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += weights[i] * d(v, i);
  }
  const check = 11 - (sum % 11);
  if (check === 10) return false;
  const expected = check === 11 ? 0 : check;
  return expected === d(v, 9);
};

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

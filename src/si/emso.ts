/**
 * EMŠO (Enotna matična številka občana).
 *
 * Slovenian unique master citizen number. 13 digits
 * encoding DDMMYYY (7-digit birth year), region code,
 * serial number, and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";

const WEIGHTS = [
  7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2,
] as const;

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const isValidDate = (
  year: number,
  month: number,
  day: number,
): boolean => {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Compute the check digit matching python-stdnum:
 * `str(-total % 11 % 10)`.
 */
const calcCheckDigit = (v: string): number => {
  let total = 0;
  for (let i = 0; i < 12; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    total += Number(v[i]) * WEIGHTS[i]!;
  }
  // Python's (-total % 11 % 10) — always 0..9
  return (((-total % 11) + 11) % 11) % 10;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "EMŠO must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "EMŠO must contain only digits",
    );
  }

  // Validate embedded birth date (DDMMYYY)
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  let yyyy = Number(v.slice(4, 7));
  if (yyyy < 800) {
    yyyy += 2000;
  } else {
    yyyy += 1000;
  }
  if (!isValidDate(yyyy, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "EMŠO contains an invalid date",
    );
  }

  if (calcCheckDigit(v) !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "EMŠO check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Slovenian Unique Master Citizen Number. */
const emso: Validator = {
  name: "Slovenian Personal ID",
  localName: "Enotna matična številka občana",
  abbreviation: "EMŠO",
  country: "SI",
  entityType: "person",
  compact,
  format,
  validate,
};

export default emso;
export { compact, format, validate };

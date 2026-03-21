/**
 * EMŠO (Enotna matična številka občana).
 *
 * Slovenian unique master citizen number. 13 digits
 * encoding DDMMYYY (7-digit birth year), region code,
 * serial number, and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number
 * @see https://www.gov.si/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const WEIGHTS = [
  7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2,
] as const;

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Compute the check digit matching python-stdnum:
 * `str(-total % 11 % 10)`.
 */
const calcCheckDigit = (v: string): number => {
  const total = weightedSum(v.slice(0, 12), WEIGHTS, 11);
  // Python's (-total % 11 % 10) — always 0..9
  // weightedSum already returns (sum % 11 + 11) % 11,
  // so total is 0..10. Negate within mod 11:
  return ((11 - total) % 11) % 10;
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
  // JMBG standard: 900-999 → 1900s, 000-899 → 2000s
  // Note: python-stdnum uses 800 as threshold, but
  // the official JMBG spec uses 900. No practical
  // difference (800-899 range has no living citizens).
  if (yyyy < 900) {
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

/**
 * Extract birth date and gender from an EMSO.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  let yyyy = Number(v.slice(4, 7));
  if (yyyy < 900) {
    yyyy += 2000;
  } else {
    yyyy += 1000;
  }

  const serial = Number(v.slice(9, 12));

  return {
    birthDate: new Date(yyyy, mm - 1, dd),
    gender: serial < 500 ? "male" : "female",
  };
};

/** Slovenian Unique Master Citizen Number. */
const emso: Validator = {
  name: "Slovenian Personal ID",
  localName: "Enotna matična številka občana",
  abbreviation: "EMŠO",
  country: "SI",
  entityType: "person",
  sourceUrl: "https://www.gov.si/",
  examples: ["0101006500006"] as const,
  compact,
  format,
  validate,
};

export default emso;
export { compact, format, parse, validate };

/**
 * RRN (Resident Registration Number, 주민등록번호).
 *
 * Korean Resident Registration Number. 13 digits
 * formatted as YYMMDD-GPPCCSD. Encodes date of
 * birth, gender/century, place of birth, community
 * center, serial, and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/Resident_registration_number
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " -/");

const CHECK_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];

/**
 * Compute the check digit for the first 12 digits.
 * Formula: (11 - sum(w_i * d_i) % 11) % 10.
 */
const checkDigit = (digits: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum +=
      (CHECK_WEIGHTS[i] ?? 0) * Number(digits.charAt(i));
  }
  return (11 - (sum % 11)) % 10;
};

/** Century prefix derived from the 7th digit. */
const CENTURY_BY_GENDER: Record<string, number> = {
  "0": 1800,
  "1": 1900,
  "2": 1900,
  "3": 2000,
  "4": 2000,
  "5": 1900,
  "6": 1900,
  "7": 2000,
  "8": 2000,
  "9": 1800,
};

/**
 * Resolve birth date components from a compacted RRN.
 * Returns null if the date is invalid.
 */
const resolveBirthDate = (
  v: string,
): { year: number; month: number; day: number } | null => {
  const century = CENTURY_BY_GENDER[v.charAt(6)];
  if (century === undefined) return null;

  const year = century + Number(v.slice(0, 2));
  const month = Number(v.slice(2, 4));
  const day = Number(v.slice(4, 6));

  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "RRN must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "RRN must contain only digits",
    );
  }
  if (resolveBirthDate(v) === null) {
    return err(
      "INVALID_COMPONENT",
      "RRN contains an invalid date of birth",
    );
  }
  const place = Number(v.slice(7, 9));
  if (place > 96) {
    return err(
      "INVALID_COMPONENT",
      "RRN place-of-birth code must be <= 96",
    );
  }
  if (checkDigit(v.slice(0, 12)) !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "RRN check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 13) {
    return `${v.slice(0, 6)}-${v.slice(6)}`;
  }
  return v;
};

/**
 * Extract birth date and gender from an RRN.
 * Returns null if the value is not valid.
 *
 * Gender digit mapping:
 *   1, 3 = male Korean; 2, 4 = female Korean
 *   5, 7 = male foreigner; 6, 8 = female foreigner
 *   0, 9 = pre-1800 (male/female by convention)
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const bd = resolveBirthDate(v);
  if (bd === null) return null;

  const genderDigit = v.charAt(6);
  const isMale = "13579".includes(genderDigit);

  return {
    birthDate: new Date(bd.year, bd.month - 1, bd.day),
    gender: isMale ? "male" : "female",
  };
};

/** Korean Resident Registration Number. */
const rrn: Validator = {
  name: "Korean Resident Registration Number",
  localName: "주민등록번호",
  abbreviation: "RRN",
  aliases: [
    "RRN",
    "주민등록번호",
    "Resident Registration Number",
  ] as const,
  candidatePattern: "\\d{6}[\\s-]?\\d{7}",
  country: "KR",
  entityType: "person",
  description:
    "13-digit personal identifier issued to all" +
    " residents of South Korea",
  sourceUrl:
    "https://en.wikipedia.org/wiki/" +
    "Resident_registration_number",
  lengths: [13] as const,
  examples: ["9710139019902", "9501011000109"] as const,
  compact,
  format,
  validate,
};

export default rrn;
export { compact, format, parse, validate };

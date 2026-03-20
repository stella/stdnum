/**
 * NRIC (Malaysian National Registration Identity
 * Card Number, Nombor Kad Pengenalan).
 *
 * 12 digits: YYMMDD (birth date) + PB (place of
 * birth, 2 digits) + SSS (serial) + G (gender:
 * odd = male, even = female).
 *
 * No checksum; validation is structural (valid date
 * and valid place-of-birth code).
 *
 * @see https://en.wikipedia.org/wiki/Malaysian_identity_card
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

/**
 * Valid place-of-birth codes (2-digit).
 * Codes 01-16 are states, 21-59 are pre-2000
 * state codes, 60-68 born outside (ASEAN),
 * 71-72/74-79 foreign nationals, 82-93 regions,
 * 98-99 legacy.
 */
const VALID_PB_CODES = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08",
  "09", "10", "11", "12", "13", "14", "15", "16",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "29", "30", "31", "32", "33", "34", "35", "36",
  "37", "38", "39", "40", "41", "42", "43", "44",
  "45", "46", "47", "48", "49", "50", "51", "52",
  "53", "54", "55", "56", "57", "58", "59", "60",
  "61", "62", "63", "64", "65", "66", "67", "68",
  "71", "72", "74", "75", "76", "77",
  "78", "79", "82", "83", "84", "85", "86", "87",
  "88", "89", "90", "91", "92", "93", "98", "99",
]);

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Resolve the birth year from a 2-digit year.
 * Years after the current year are assumed to be
 * in the previous century.
 */
const resolveYear = (yy: number): number => {
  const currentYear = new Date().getFullYear();
  const century = Math.floor(currentYear / 100);
  const year = century * 100 + yy;
  return year > currentYear ? year - 100 : year;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "NRIC must be exactly 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NRIC must contain only digits",
    );
  }

  // Validate birth date (YYMMDD)
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));

  const year = resolveYear(yy);

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "NRIC contains an invalid birth date",
    );
  }

  // Validate place-of-birth code
  const pb = v.slice(6, 8);
  if (!VALID_PB_CODES.has(pb)) {
    return err(
      "INVALID_COMPONENT",
      "Invalid place-of-birth code: " + pb,
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return (
    v.slice(0, 6) + "-" +
    v.slice(6, 8) + "-" +
    v.slice(8)
  );
};

/**
 * Extract birth date and gender from an NRIC.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const year = resolveYear(yy);

  // Last digit: odd = male, even = female
  const lastDigit = Number(v[11]);
  const gender =
    lastDigit % 2 === 1 ? "male" : "female";

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender,
  };
};

/** Malaysian National Registration Identity Card. */
const nric: Validator = {
  name: "Malaysian National Registration Identity Card Number",
  localName: "Nombor Kad Pengenalan",
  abbreviation: "NRIC",
  country: "MY",
  entityType: "person",
  description:
    "12-digit identity card number encoding birth date, place of birth, and gender",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Malaysian_identity_card",
  lengths: [12] as const,
  examples: [
    "770305021234",
    "880715141234",
  ] as const,
  compact,
  format,
  validate,
};

export default nric;
export { compact, format, parse, validate };

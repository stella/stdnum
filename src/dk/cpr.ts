/**
 * CPR (Det Centrale Personregister).
 *
 * Danish personal identification number. 10 digits
 * in format DDMMYY-SSSS. Checksum enforcement was
 * dropped in 2007; only date validation is performed.
 *
 * @see https://cpr.dk/
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import {
  randomDigits,
  randomInt,
} from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const getCentury = (yy: number, s7: number): number => {
  // 7th digit (first of serial) determines century
  if (s7 >= 0 && s7 <= 3) return 1900;
  if (s7 === 4 || s7 === 9) {
    return yy <= 36 ? 2000 : 1900;
  }
  // s7 5..8
  return yy <= 57 ? 2000 : 1800;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "CPR must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CPR must contain only digits",
    );
  }

  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));
  const s7 = Number(v[6]);

  const century = getCentury(yy, s7);
  const year = century + yy;

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "CPR contains an invalid date",
    );
  }

  // Reject future birth dates
  if (new Date(year, mm - 1, dd) > new Date()) {
    return err(
      "INVALID_COMPONENT",
      "CPR birth date is in the future",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)}-${v.slice(6)}`;
};

/**
 * Extract birth date and gender from a CPR number.
 * Returns null if the value is not valid.
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));
  const s7 = Number(v[6]);
  const lastDigit = Number(v[9]);

  const century = getCentury(yy, s7);
  const year = century + yy;

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender: lastDigit % 2 === 0 ? "female" : "male",
  };
};

/** Generate a random valid Danish CPR. */
const generate = (): string => {
  const year = randomInt(1900, 2024);
  const month = String(randomInt(1, 12)).padStart(2, "0");
  const day = String(randomInt(1, 28)).padStart(2, "0");
  const yy = String(year % 100).padStart(2, "0");
  const serialPrefix = String(randomInt(0, 3));
  return `${day}${month}${yy}${serialPrefix}${randomDigits(3)}`;
};

/** Danish Personal Identification Number. */
const cpr: Validator<ParsedPersonId> = {
  name: "Danish Personal ID",
  localName: "Det Centrale Personregister",
  abbreviation: "CPR",
  aliases: ["CPR-nummer", "personnummer", "CPR"] as const,
  candidatePattern: "\\d{6}-?\\d{4}",
  country: "DK",
  entityType: "person",
  sourceUrl: "https://cpr.dk/",
  lengths: [10] as const,
  examples: ["2110625629"] as const,
  compact,
  format,
  parse,
  validate,
  generate,
};

export default cpr;
export { compact, format, generate, parse, validate };

/**
 * Personnummer (Personal Identity Number).
 *
 * Swedish personal identification number. 10 digits
 * in compact form (YYMMDDNNNC) with a Luhn checksum
 * on all 10 digits.
 *
 * @see https://www.skatteverket.se/privat/folkbokforing/personnummer.4.3810a01c150939e893f18c29.html
 */

import { luhnValidate } from "#checksums/luhn";
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
 * Match python-stdnum's compact: preserve the '-' or '+'
 * separator at position -5, and strip any others.
 */
const compact = (value: string): string => {
  let v = clean(value, " :");
  if (
    (v.length === 10 || v.length === 12) &&
    v[v.length - 5] !== "-" &&
    v[v.length - 5] !== "+"
  ) {
    v = `${v.slice(0, -4)}-${v.slice(-4)}`;
  }
  const prefix = v
    .slice(0, -5)
    .replace(/-/g, "")
    .replace(/\+/g, "");
  return `${prefix}${v.slice(-5)}`;
};

/**
 * Extract the birth date from the compacted number.
 * Matches python-stdnum's get_birth_date.
 */
const getBirthDate = (
  v: string,
): { year: number; month: number; day: number } | null => {
  let year: number;
  let month: number;
  let day: number;

  if (v.length === 13) {
    year = Number(v.slice(0, 4));
    month = Number(v.slice(4, 6));
    day = Number(v.slice(6, 8));
  } else {
    const currentYear = new Date().getFullYear();
    let century = Math.floor(currentYear / 100);
    const yy = Number(v.slice(0, 2));
    if (yy > currentYear % 100) century -= 1;
    if (v[v.length - 5] === "+") century -= 1;
    year = century * 100 + yy;
    month = Number(v.slice(2, 4));
    day = Number(v.slice(4, 6));
  }

  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11 && v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "Personnummer must be 10 or 12 digits",
    );
  }

  const digits = v.slice(0, -5) + v.slice(-4);
  const sep = v[v.length - 5];
  if ((sep !== "-" && sep !== "+") || !isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Personnummer has invalid format",
    );
  }

  if (getBirthDate(v) === null) {
    return err(
      "INVALID_COMPONENT",
      "Personnummer contains an invalid date",
    );
  }

  if (!luhnValidate(digits.slice(-10))) {
    return err(
      "INVALID_CHECKSUM",
      "Personnummer Luhn check does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from a Personnummer.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const birthDate = getBirthDate(v);
  if (birthDate === null) return null;

  const genderDigit = Number(v[v.length - 2]);

  return {
    birthDate: new Date(
      birthDate.year,
      birthDate.month - 1,
      birthDate.day,
    ),
    gender: genderDigit % 2 === 0 ? "female" : "male",
  };
};

/** Swedish Personal Identity Number. */
const personnummer: Validator = {
  name: "Swedish Personal ID",
  localName: "Personnummer",
  abbreviation: "PN",
  country: "SE",
  entityType: "person",
  compact,
  format,
  validate,
};

export default personnummer;
export { compact, format, parse, validate };

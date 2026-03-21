/**
 * Civil Number (الرقم المدني, Kuwait).
 *
 * 12-digit number issued by PACI (Public Authority
 * for Civil Information):
 *   C       = century indicator (2 = 1900s, 3 = 2000s)
 *   YYMMDD  = birth date
 *   SSSS    = serial number
 *   K       = check digit (mod 11 weighted sum)
 *
 * @see https://prakhar.me/articles/kuwait-civil-id-checksum/
 * @see https://kuwaitsexpat.com/kuwait-civil-id-format/
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

const WEIGHTS = [
  2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2,
] as const;

const centuryMap: Record<number, number> = {
  2: 1900,
  3: 2000,
};

const compact = (value: string): string =>
  clean(value, " -");

const calcCheckDigit = (digits: string): number => {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    // SAFETY: loop bound guarantees valid index
    sum += Number(digits[i]) * WEIGHTS[i]!;
  }
  return (11 - (sum % 11)) % 11;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Kuwait civil number must be 12 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Kuwait civil number must contain only digits",
    );
  }

  const centuryDigit = Number(v[0]);
  if (centuryDigit !== 2 && centuryDigit !== 3) {
    return err(
      "INVALID_COMPONENT",
      "Century digit must be 2 or 3",
    );
  }

  const yearBase = centuryMap[centuryDigit] ?? 1900;
  const yy = Number(v.slice(1, 3));
  const mm = Number(v.slice(3, 5));
  const dd = Number(v.slice(5, 7));
  const year = yearBase + yy;

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "Civil number contains an invalid birth date",
    );
  }

  const expected = calcCheckDigit(v.slice(0, 11));
  if (expected !== Number(v[11])) {
    return err(
      "INVALID_CHECKSUM",
      "Civil number check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 1)} ${v.slice(1, 7)} ${v.slice(7, 11)} ${v.slice(11)}`;
};

/**
 * Extract birth date from a Kuwait civil number.
 * Gender is not encoded in the number.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): Omit<ParsedPersonId, "gender"> | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const centuryDigit = Number(v[0]);
  const yearBase = centuryMap[centuryDigit] ?? 1900;
  const yy = Number(v.slice(1, 3));
  const mm = Number(v.slice(3, 5));
  const dd = Number(v.slice(5, 7));
  const year = yearBase + yy;

  return {
    birthDate: new Date(year, mm - 1, dd),
  };
};

/** Kuwait Civil Number (الرقم المدني). */
const civil: Validator = {
  name: "Civil Number",
  localName: "الرقم المدني",
  abbreviation: "Civil ID",
  country: "KW",
  entityType: "person",
  lengths: [12] as const,
  examples: [
    "289011200032",
    "305031512348",
  ] as const,
  description:
    "12-digit civil identification number issued by PACI",
  sourceUrl:
    "https://kuwaitsexpat.com/kuwait-civil-id-format/",
  compact,
  format,
  validate,
};

export default civil;
export { compact, format, parse, validate };

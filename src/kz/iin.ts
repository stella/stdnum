/**
 * IIN (Individual Identification Number,
 * Жеке сәйкестендіру нөмірі / ИИН).
 *
 * Kazakhstan individual identification number. 12 digits:
 *   YYMMDD = birth date
 *   C      = century/gender (1-6)
 *   SSSS   = serial number
 *   K      = check digit (two-pass weighted sum mod 11)
 *
 * Odd century digits = male, even = female.
 * 1-2 = 1800s, 3-4 = 1900s, 5-6 = 2000s.
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Kazakhstan-TIN.pdf
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const WEIGHTS_1 = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
] as const;
const WEIGHTS_2 = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2,
] as const;

const centuryMap: Record<number, number> = {
  1: 1800,
  2: 1800,
  3: 1900,
  4: 1900,
  5: 2000,
  6: 2000,
};

const compact = (value: string): string =>
  clean(value, " -").trim();

/**
 * Two-pass check digit: weighted sum mod 11 with
 * fallback to second weight set.
 */
const calcCheckDigit = (digits: string): number => {
  let remainder = weightedSum(digits, WEIGHTS_1, 11);
  if (remainder === 10) {
    remainder = weightedSum(digits, WEIGHTS_2, 11);
  }
  return remainder === 10 ? 0 : remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Kazakhstan IIN must be 12 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Kazakhstan IIN must contain only digits",
    );
  }

  const centuryDigit = Number(v[6]);
  if (centuryDigit < 1 || centuryDigit > 6) {
    return err(
      "INVALID_COMPONENT",
      "IIN century/gender digit must be 1-6",
    );
  }

  const yearBase = centuryMap[centuryDigit] ?? 1900;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const year = yearBase + yy;

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "IIN contains an invalid birth date",
    );
  }

  const expected = calcCheckDigit(v.slice(0, 11));
  if (expected !== Number(v[11])) {
    return err(
      "INVALID_CHECKSUM",
      "IIN check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)} ${v.slice(6)}`;
};

/**
 * Extract birth date and gender from a Kazakhstan IIN.
 * Returns null if the value is not valid.
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const centuryDigit = Number(v[6]);
  const yearBase = centuryMap[centuryDigit] ?? 1900;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const year = yearBase + yy;

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender: centuryDigit % 2 === 1 ? "male" : "female",
  };
};

/** Generate a random valid Kazakhstan IIN. */
const generate = (): string => {
  for (;;) {
    const yy = String(randomInt(50, 99)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const gender = String(randomInt(1, 6));
    const serial = randomDigits(4);
    const payload = yy + mm + dd + gender + serial;
    const check = calcCheckDigit(payload);
    if (check === null) continue;
    const c = payload + String(check);
    if (validate(c).valid) return c;
  }
};

/**
 * Kazakhstan Individual Identification Number (IIN).
 *
 * Examples sourced from identique/idnumbers test suite.
 */
const iin: Validator = {
  name: "Kazakhstan Individual ID",
  localName: "Жеке сәйкестендіру нөмірі",
  abbreviation: "IIN",
  aliases: [
    "ИИН",
    "IIN",
    "индивидуальный идентификационный номер",
  ] as const,
  candidatePattern: "\\d{12}",
  country: "KZ",
  entityType: "person",
  lengths: [12] as const,
  examples: ["880515300120", "950101400012"] as const,
  compact,
  format,
  validate,
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/" +
    "crs-implementation-and-assistance/" +
    "tax-identification-numbers/Kazakhstan-TIN.pdf",
  generate,
};

export default iin;
export { compact, format, parse, validate, generate };

/**
 * EMŠO (Enotna matična številka občana).
 *
 * Slovenian unique master citizen number. 13 digits
 * encoding DDMMYYY (7-digit birth year), region code,
 * serial number, and a check digit.
 *
 * Canonical source:
 * - Slovenia government registry overview
 *
 * This is the source behind the stricter register
 * code check (50-59) and the decision to reject
 * future birth dates in the embedded date field.
 *
 * @see https://www.gov.si/teme/registri-in-evidence-prebivalstva/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomInt } from "#util/generate";
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
  if (new Date(yyyy, mm - 1, dd) > new Date()) {
    return err(
      "INVALID_COMPONENT",
      "EMŠO cannot contain a future birth date",
    );
  }

  const register = Number(v.slice(7, 9));
  if (register < 50 || register > 59) {
    return err(
      "INVALID_COMPONENT",
      "EMSO register code must be between 50 and 59",
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
const parse = (value: string): ParsedPersonId | null => {
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

/** Generate a random valid Slovenian EMSO. */
const generate = (): string => {
  for (;;) {
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const yyy = String(randomInt(900, 999));
    const rr = String(randomInt(50, 59));
    const sss = String(randomInt(0, 999)).padStart(3, "0");
    const partial = dd + mm + yyy + rr + sss;
    const c = partial + String(calcCheckDigit(partial));
    if (validate(c).valid) return c;
  }
};

/** Slovenian Unique Master Citizen Number. */
const emso: Validator<ParsedPersonId> = {
  name: "Slovenian Personal ID",
  localName: "Enotna matična številka občana",
  abbreviation: "EMŠO",
  aliases: [
    "EMŠO",
    "enotna matična številka občana",
  ] as const,
  candidatePattern: "\\d{13}",
  country: "SI",
  entityType: "person",
  sourceUrl:
    "https://www.gov.si/teme/registri-in-evidence-prebivalstva/",
  examples: ["0101006500006"] as const,
  compact,
  format,
  parse,
  validate,
  generate,
};

export default emso;
export { compact, format, parse, validate, generate };

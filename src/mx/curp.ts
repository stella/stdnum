/**
 * CURP (Clave Única de Registro de Población).
 *
 * Mexican personal identification number. 18 characters:
 * 4 letters (name encoding) + 6 digits (YYMMDD birth
 * date) + 1 letter (gender: H=male, M=female) + 2
 * letters (state code) + 3 consonants (name
 * disambiguation) + 1 digit (century discriminator) +
 * 1 check digit.
 *
 * The check digit is computed as a weighted sum mod 10
 * using an alphabet mapping (0-9, A-N, &, O-Z).
 *
 * @see https://en.wikipedia.org/wiki/CURP
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

/** Valid Mexican state codes (2-letter). */
const STATE_CODES = new Set([
  "AS", "BC", "BS", "CC", "CL", "CM", "CS", "CH",
  "DF", "DG", "GT", "GR", "HG", "JC", "MC", "MN",
  "MS", "NT", "NL", "OC", "PL", "QT", "QR", "SP",
  "SL", "SR", "TC", "TS", "TL", "VZ", "YN", "ZS",
  "NE", // Born abroad
]);

/**
 * Alphabet for CURP check digit computation.
 * Matches python-stdnum: digits 0-9, then A-N,
 * ampersand, O-Z.
 */
const ALPHABET =
  "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ";

const CHAR_MAP = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) {
  CHAR_MAP.set(ALPHABET[i]!, i);
}

const compact = (value: string): string =>
  clean(value, " -").trim().toUpperCase();

/**
 * Compute the CURP check digit. Sum each of the first
 * 17 characters multiplied by weight (18 - position),
 * then check = (10 - sum % 10) % 10.
 */
const calcCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (CHAR_MAP.get(value[i]!) ?? 0) * (18 - i);
  }
  return String((10 - (sum % 10)) % 10);
};

/**
 * Resolve full year from 2-digit year and century
 * discriminator: 0-9 = 1900s, letter = 2000s.
 */
const resolveCurpYear = (
  yy: number,
  centuryChar: string,
): number =>
  centuryChar >= "0" && centuryChar <= "9"
    ? 1900 + yy
    : 2000 + yy;

const CURP_RE =
  /^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[0-9A-Z]\d$/;

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 18) {
    return err(
      "INVALID_LENGTH",
      "CURP must be 18 characters",
    );
  }

  if (!CURP_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "CURP has an invalid format",
    );
  }

  // Validate the embedded date (YYMMDD at positions 4-9).
  const yy = Number(v.slice(4, 6));
  const mm = Number(v.slice(6, 8));
  const dd = Number(v.slice(8, 10));

  const year = resolveCurpYear(yy, v[16]!);
  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "CURP contains an invalid birth date",
    );
  }

  // Validate state code at positions 11-12.
  const state = v.slice(11, 13);
  if (!STATE_CODES.has(state)) {
    return err(
      "INVALID_COMPONENT",
      "CURP contains an invalid state code",
    );
  }

  // Verify check digit (last character).
  const expected = calcCheckDigit(v);
  if (v[17] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "CURP check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from a CURP.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const yy = Number(v.slice(4, 6));
  const mm = Number(v.slice(6, 8));
  const dd = Number(v.slice(8, 10));

  const year = resolveCurpYear(yy, v[16]!);

  const genderChar = v[10];
  const gender: "male" | "female" =
    genderChar === "H" ? "male" : "female";

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender,
  };
};

/**
 * Mexican CURP (personal identification number).
 *
 * Example sourced from python-stdnum test suite.
 */
const curp: Validator = {
  name: "Mexican Personal ID",
  localName: "Clave Única de Registro de Población",
  abbreviation: "CURP",
  aliases: [
    "CURP",
    "Clave Única de Registro de Población",
  ] as const,
  candidatePattern:
    "[A-Z]{4}\\d{6}[HM][A-Z]{5}[A-Z\\d]\\d",
  country: "MX",
  entityType: "person",
  lengths: [18] as const,
  examples: ["BOXW310820HNERXN09"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://en.wikipedia.org/wiki/CURP",
};

export default curp;
export { compact, format, parse, validate };

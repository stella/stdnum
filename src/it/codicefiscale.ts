/**
 * Codice Fiscale (Italian tax code).
 *
 * 16-character alphanumeric code encoding name,
 * birth date, gender, and birthplace. The last
 * character is a check letter computed using
 * odd/even position value tables.
 *
 * Supports omocodia: when two people share the
 * same code, the tax office replaces digit
 * positions with letters from the set LMNPQRSTUV
 * (L=0, M=1, N=2, P=3, Q=4, R=5, S=6, T=7,
 * U=8, V=9). Only these 10 letters are valid
 * substitutes at digit positions.
 *
 * Also accepts 11-digit numbers (delegates to
 * Partita IVA validation).
 *
 * @see https://www.agenziaentrate.gov.it/
 * @see https://it.wikipedia.org/wiki/Codice_fiscale#Omocodia
 */

import { clean } from "#util/clean";
import { randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";
import { validate as validateIva } from "./iva";

// Values for odd-positioned characters (0-based
// index 0, 2, 4, ...)
const ODD: Record<string, number> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

// Values for even-positioned characters (0-based
// index 1, 3, 5, ...)
const EVEN: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,
};

const CHECK_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Omocodia letter-to-digit mapping. */
const OMOCODIA: Record<string, string> = {
  L: "0",
  M: "1",
  N: "2",
  P: "3",
  Q: "4",
  R: "5",
  S: "6",
  T: "7",
  U: "8",
  V: "9",
};

/** Month letter to 1-based month number. */
const MONTH_LETTERS: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  H: 6,
  L: 7,
  M: 8,
  P: 9,
  R: 10,
  S: 11,
  T: 12,
};

const decodeCfDigit = (ch: string): number => {
  const mapped = OMOCODIA[ch];
  if (mapped !== undefined) return Number(mapped);
  return Number(ch);
};

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  // 11-digit: delegate to Partita IVA
  if (v.length === 11 && isdigits(v)) {
    return validateIva(v);
  }

  if (v.length !== 16) {
    return err(
      "INVALID_LENGTH",
      "Codice Fiscale must be 16 characters",
    );
  }
  // Structural format: 6 letters + 2 alphanumeric
  // + 1 letter (month) + 2 alphanumeric + 1 letter
  // (municipality) + 3 alphanumeric + 1 check letter
  // The "alphanumeric" positions accept omocodia
  // substitution letters (LMNPQRSTUV for 0-9)
  if (
    // Omocodia: digits can be replaced with
    // LMNPQRSTUV only (not arbitrary letters)
    !/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(
      v,
    )
  ) {
    return err(
      "INVALID_FORMAT",
      "Codice Fiscale format is invalid",
    );
  }

  // Compute check letter
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = v[i];
    if (ch === undefined) continue;
    if (i % 2 === 0) {
      // Odd position (1-based) = even index
      const val = ODD[ch];
      if (val === undefined) {
        return err(
          "INVALID_FORMAT",
          "Codice Fiscale contains invalid char",
        );
      }
      sum += val;
    } else {
      const val = EVEN[ch];
      if (val === undefined) {
        return err(
          "INVALID_FORMAT",
          "Codice Fiscale contains invalid char",
        );
      }
      sum += val;
    }
  }

  const expected = CHECK_LETTERS[sum % 26];
  if (expected !== v[15]) {
    return err(
      "INVALID_CHECKSUM",
      "Codice Fiscale check letter mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from a Codice Fiscale.
 * Returns null if the value is not valid or is an
 * 11-digit Partita IVA (no personal data embedded).
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  if (v.length !== 16) return null;

  const yy =
    decodeCfDigit(v.charAt(6)) * 10 +
    decodeCfDigit(v.charAt(7));
  const month = MONTH_LETTERS[v.charAt(8)];
  if (month === undefined) return null;
  let dd =
    decodeCfDigit(v.charAt(9)) * 10 +
    decodeCfDigit(v.charAt(10));

  const gender = dd > 40 ? "female" : "male";
  if (dd > 40) dd -= 40;

  const currentYear = new Date().getFullYear();
  let year = 2000 + yy;
  if (year > currentYear) year -= 100;

  return {
    birthDate: new Date(year, month - 1, dd),
    gender,
  };
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MONTH_CODES = Object.keys(MONTH_LETTERS);

const randomLetter = (): string =>
  LETTERS.charAt(randomInt(0, LETTERS.length - 1));

/** Generate a random valid 16-character Codice Fiscale. */
const generate = (): string => {
  let body = "";

  for (let i = 0; i < 6; i++) {
    body += randomLetter();
  }

  body += String(randomInt(0, 99)).padStart(2, "0");
  body +=
    MONTH_CODES[randomInt(0, MONTH_CODES.length - 1)] ??
    "A";

  const day =
    randomInt(1, 28) + (Math.random() < 0.5 ? 0 : 40);
  body += String(day).padStart(2, "0");
  body += randomLetter();
  body += String(randomInt(0, 999)).padStart(3, "0");

  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === undefined) continue;
    sum +=
      i % 2 === 0
        ? (ODD[ch] ?? 0)
        : (EVEN[ch] ?? 0);
  }

  return `${body}${CHECK_LETTERS.charAt(sum % 26)}`;
};

/** Italian Tax Code. */
const codiceFiscale: Validator<ParsedPersonId> = {
  name: "Italian Tax Code",
  localName: "Codice Fiscale",
  abbreviation: "CF",
  aliases: [
    "codice fiscale",
    "C.F.",
    "CF",
    "cod. fisc.",
    "fiscal code",
  ] as const,
  candidatePattern:
    "[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]",
  country: "IT",
  entityType: "person",
  description:
    "Personal/company tax code (16-char personal, 11-digit company)",
  sourceUrl: "https://www.agenziaentrate.gov.it/",
  lengths: [11, 16] as const,
  examples: ["RCCMNL83S18D969H"] as const,
  compact,
  format,
  parse,
  validate,
  generate,
};

export default codiceFiscale;
export { compact, format, generate, parse, validate };

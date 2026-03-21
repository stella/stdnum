/**
 * SEDOL (Stock Exchange Daily Official List number).
 *
 * 7-character security identifier used in the UK and
 * Ireland, assigned by the London Stock Exchange.
 * Consists of 6 alphanumeric characters (vowels
 * excluded) followed by a weighted mod-10 check
 * digit.
 *
 * @see https://en.wikipedia.org/wiki/SEDOL
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomInt } from "#util/generate";

/**
 * Allowed characters in a SEDOL: digits and
 * consonants only (vowels are never used).
 * Spaces occupy vowel positions (A=10, E=14,
 * I=18, O=24, U=30) so that indexOf returns
 * the correct SEDOL weight for each consonant.
 */
const ALPHABET =
  "0123456789 BCD FGH JKLMN PQRST VWXYZ";

const WEIGHTS = [1, 3, 1, 7, 3, 9] as const;

const calcCheckDigit = (number: string): string => {
  if (number.length !== 6) {
    throw new Error(
      "calcCheckDigit requires a 6-character " +
        "SEDOL prefix",
    );
  }
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    const ch = number[i]!;
    const val = ALPHABET.indexOf(ch);
    if (val < 0) {
      throw new Error(
        `Invalid SEDOL character: ${ch}`,
      );
    }
    // SAFETY: weights length matches loop bound
    sum += WEIGHTS[i]! * val;
  }
  return String((10 - (sum % 10)) % 10);
};

const compact = (value: string): string =>
  clean(value, " ").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 7) {
    return err(
      "INVALID_LENGTH",
      "SEDOL must be exactly 7 characters",
    );
  }

  for (const ch of v) {
    if (!ALPHABET.includes(ch)) {
      return err(
        "INVALID_FORMAT",
        "SEDOL contains invalid character: " +
          "vowels are not allowed",
      );
    }
  }

  // Old-style SEDOLs are fully numeric; new-style
  // SEDOLs start with a letter. A number that starts
  // with a digit but contains letters is invalid.
  if (isdigits(v[0]!) && !isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Numeric-prefix SEDOL must be fully " +
        "numeric (old-style)",
    );
  }

  if (calcCheckDigit(v.slice(0, 6)) !== v[6]) {
    return err(
      "INVALID_CHECKSUM",
      "SEDOL check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string =>
  compact(value);

/** Generate a random valid SEDOL. */
const generate = (): string => {
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
  const chars = "0123456789BCDFGHJKLMNPQRSTVWXYZ";
  const first = consonants[randomInt(0, consonants.length - 1)]!;
  let payload = first;
  for (let i = 1; i < 6; i++) payload += chars[randomInt(0, chars.length - 1)]!;
  return payload + calcCheckDigit(payload);
};

/** Stock Exchange Daily Official List number. */
const sedol: Validator = {
  name: "Stock Exchange Daily Official List number",
  localName:
    "Stock Exchange Daily Official List number",
  abbreviation: "SEDOL",
  country: "GB",
  entityType: "any",
  sourceUrl: "https://en.wikipedia.org/wiki/SEDOL",
  lengths: [7] as const,
  examples: ["B15KXQ8"] as const,
  compact,
  format,
  validate,
  generate,
};

export default sedol;
export { calcCheckDigit, compact, format, validate, generate };

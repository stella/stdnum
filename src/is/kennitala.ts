/**
 * Kennitala (Icelandic identification number).
 *
 * 10 digits: DDMMYY + 2 random + 1 check + 1 century.
 * Weights [3,2,7,6,5,4,3,2] on first 8 digits,
 * check digit at position 9, century at position 10
 * (weight 0, does not participate in checksum).
 * Organizations use day + 40. Century digit: 9 = 1900s,
 * 0 = 2000s.
 *
 * @see https://www.skra.is/
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2, 0, 0] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Kennitala must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Kennitala must contain only digits",
    );
  }

  // Checksum: weights on first 8 digits, check is 9th
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(v[i]) * WEIGHTS[i];
  }
  const remainder = (11 - (sum % 11)) % 11;
  if (remainder === 10 || remainder !== Number(v[8])) {
    return err(
      "INVALID_CHECKSUM",
      "Kennitala check digit mismatch",
    );
  }

  // Parse date
  let dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));
  const centuryDigit = Number(v[9]);

  // Organizations use day + 40
  if (dd > 40) dd -= 40;

  let century: number;
  if (centuryDigit === 9) {
    century = 1900;
  } else if (centuryDigit === 0) {
    century = 2000;
  } else {
    return err(
      "INVALID_COMPONENT",
      "Kennitala century digit must be 0 or 9",
    );
  }

  const year = century + yy;
  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "Kennitala contains an invalid date",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)}-${v.slice(6)}`;
};

/** Icelandic Identification Number. */
const kennitala: Validator = {
  name: "Icelandic ID Number",
  localName: "Kennitala",
  abbreviation: "kt.",
  aliases: ["kennitala", "kt."] as const,
  candidatePattern: "\\d{6}-?\\d{4}",
  country: "IS",
  entityType: "any",
  sourceUrl: "https://www.skra.is/",
  examples: ["4504013150", "1201743399"] as const,
  compact,
  format,
  validate,
};

export default kennitala;
export { compact, format, validate };

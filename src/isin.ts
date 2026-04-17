/**
 * ISIN (International Securities Identification
 * Number).
 *
 * ISO 6166. 12-character alphanumeric code:
 * [A-Z]{2} (country) + [0-9A-Z]{9} (identifier) +
 * [0-9]{1} (check digit). Validated using the Luhn
 * algorithm on the alpha-numeric expansion.
 *
 * @see https://www.isin.org/
 */

import { luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { randomInt } from "#util/generate";
import { err } from "#util/result";
import { charValue, isalnum } from "#util/strings";

import type { ValidateResult, Validator } from "./types";

const ISIN_RE = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

/**
 * Expand each character to its numeric value
 * (A=10..Z=35, digits unchanged) and concatenate.
 */
const expand = (value: string): string => {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch !== undefined) {
      result += String(charValue(ch));
    }
  }
  return result;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "ISIN must be exactly 12 characters",
    );
  }
  if (!isalnum(v)) {
    return err(
      "INVALID_FORMAT",
      "ISIN must contain only letters and digits",
    );
  }
  if (!ISIN_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "ISIN must match [A-Z]{2}[0-9A-Z]{9}[0-9]",
    );
  }
  const expanded = expand(v);
  if (luhnChecksum(expanded) !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "ISIN check digit is incorrect",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)} ${v.slice(2, 6)} ${v.slice(6, 10)} ${v.slice(10)}`;
};

/** Generate a random valid ISIN. */
const generate = (): string => {
  const countries = ["US", "GB", "DE", "FR", "JP"];
  for (;;) {
    const cc =
      countries[randomInt(0, countries.length - 1)]!;
    let nsin = "";
    for (let i = 0; i < 9; i++)
      nsin += String(randomInt(0, 9));
    const base = cc + nsin;
    for (let d = 0; d <= 9; d++) {
      const c = base + String(d);
      if (validate(c).valid) return c;
    }
  }
};

/** International Securities Identification Number. */
const isin: Validator = {
  name: "International Securities Identification Number",
  localName:
    "International Securities Identification Number",
  abbreviation: "ISIN",
  aliases: [
    "ISIN",
    "International Securities Identification Number",
  ] as const,
  candidatePattern: "[A-Z]{2}[A-Z0-9]{9}\\d",
  entityType: "any",
  sourceUrl: "https://www.isin.org/",
  examples: ["US0378331005", "GB0002634946"] as const,
  compact,
  format,
  validate,
  generate,
};

export default isin;
export { compact, format, validate, generate };

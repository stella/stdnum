/**
 * My Number (Individual Number, マイナンバー).
 *
 * Japanese Individual Number. 12 digits with a
 * mod 11 check digit. Assigned to every resident
 * of Japan for tax and social security purposes.
 * Contains no encoded personal information.
 *
 * @see https://en.wikipedia.org/wiki/Individual_Number
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const WEIGHTS = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Compute the check digit for an 11-digit payload.
 * remainder <= 1 yields 0; otherwise 11 - remainder.
 */
const checkDigit = (payload: string): number => {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += (WEIGHTS[i] ?? 0) * Number(payload.charAt(i));
  }
  const remainder = sum % 11;
  return remainder <= 1 ? 0 : 11 - remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "My Number must be exactly 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "My Number must contain only digits",
    );
  }
  const expected = checkDigit(v.slice(0, 11));
  if (expected !== Number(v[11])) {
    return err(
      "INVALID_CHECKSUM",
      "My Number check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 12) {
    return `${v.slice(0, 4)} ${v.slice(4, 8)} ${v.slice(8)}`;
  }
  return v;
};

/** Generate a random valid My Number. */
const generate = (): string => {
  const payload = randomDigits(11);
  const check = checkDigit(payload);
  return `${payload}${String(check)}`;
};

/** Japanese Individual Number (My Number). */
const mynumber: Validator = {
  name: "Japanese Individual Number",
  localName: "マイナンバー",
  abbreviation: "My Number",
  aliases: [
    "My Number",
    "マイナンバー",
    "個人番号",
  ] as const,
  candidatePattern: "\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}",
  country: "JP",
  entityType: "person",
  description:
    "12-digit personal identifier for tax" +
    " and social security",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Individual_Number",
  lengths: [12] as const,
  examples: ["123456789018", "000000000019"] as const,
  compact,
  format,
  validate,
  generate,
};

export default mynumber;
export { compact, format, generate, validate };

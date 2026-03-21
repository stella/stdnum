/**
 * PNF (ЛНЧ, Личен номер на чужденец).
 *
 * Bulgarian personal number of a foreigner.
 * 10 digits; the last digit is a weighted checksum.
 *
 * @see https://en.wikipedia.org/wiki/Unique_citizenship_number
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [
  21, 19, 17, 13, 11, 9, 7, 3, 1,
] as const;

const compact = (value: string): string =>
  clean(value, " -.");

const calcCheckDigit = (number: string): string => {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    // SAFETY: WEIGHTS has exactly 9 entries
    // eslint-disable-next-line no-non-null-assertion
    sum += WEIGHTS[i]! * Number(number[i]);
  }
  return String(sum % 10);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "PNF must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "PNF must contain only digits",
    );
  }
  if (calcCheckDigit(v.slice(0, 9)) !== v[9]) {
    return err(
      "INVALID_CHECKSUM",
      "PNF check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid PNF. */
const generate = (): string => {
  const payload = randomDigits(9);
  return payload + calcCheckDigit(payload);
};

/** Bulgarian Personal Number of a Foreigner. */
const pnf: Validator = {
  name: "Bulgarian Foreigner Number",
  localName: "Личен номер на чужденец",
  abbreviation: "ЛНЧ",
  aliases: [
    "ЛНЧ",
    "личен номер на чужденец",
    "PNF",
  ] as const,
  candidatePattern: "\\d{10}",
  country: "BG",
  entityType: "person",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Unique_citizenship_number",
  examples: ["7111042925"] as const,
  compact,
  format,
  validate,
  generate,
};

export default pnf;
export { compact, format, validate, generate };

/**
 * CN (Corporate Number, 法人番号).
 *
 * Japanese Corporate Number. 13 digits with a
 * check digit based on modulus 9. Assigned by the
 * National Tax Agency.
 *
 * @see https://en.wikipedia.org/wiki/Corporate_Number_(Japan)
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Compute the check digit for a 12-digit payload.
 * Weights alternate [1,2,1,2,...] from the
 * rightmost digit of the payload.
 */
const checkDigit = (payload: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(payload[11 - i]);
    const weight = (i % 2 === 0) ? 1 : 2;
    sum += digit * weight;
  }
  return 9 - (sum % 9);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "Corporate Number must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Corporate Number must contain only digits",
    );
  }
  const expected = checkDigit(v.slice(1));
  if (expected !== Number(v[0])) {
    return err(
      "INVALID_CHECKSUM",
      "Corporate Number check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  compact(value);

/** Generate a random valid Corporate Number. */
const generate = (): string => {
  const payload = randomDigits(12);
  const check = checkDigit(payload);
  return `${String(check)}${payload}`;
};

/** Japanese Corporate Number. */
const cn: Validator = {
  name: "Japanese Corporate Number",
  localName: "法人番号",
  abbreviation: "CN",
  aliases: [
    "法人番号",
    "Corporate Number",
  ] as const,
  candidatePattern: "\\d{13}",
  country: "JP",
  entityType: "company",
  description:
    "13-digit corporate identifier assigned by the National Tax Agency",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Corporate_Number_(Japan)",
  lengths: [13] as const,
  examples: ["5835678256246", "2021001052596"] as const,
  compact,
  format,
  validate,
  generate,
};

export default cn;
export { compact, format, generate, validate };

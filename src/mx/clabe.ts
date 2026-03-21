/**
 * CLABE (Clave Bancaria Estandarizada).
 *
 * Mexican standardized bank account number used for
 * interbank electronic fund transfers. 18 digits:
 * 3 (bank code) + 3 (branch) + 11 (account number)
 * + 1 (check digit).
 *
 * The check digit is computed using a weighted sum with
 * repeating weights [3, 7, 1] modulo 10:
 * check = (10 - sum % 10) % 10.
 *
 * @see https://en.wikipedia.org/wiki/CLABE
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [3, 7, 1] as const;

const compact = (value: string): string =>
  clean(value, " -").trim();

/**
 * Compute the CLABE check digit.
 *
 * For each of the first 17 digits, multiply by the
 * corresponding weight [3, 7, 1, 3, 7, 1, ...], take
 * the result mod 10, sum all remainders, then
 * check = (10 - sum % 10) % 10.
 */
const calcCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const digit = Number(value[i]);
    // SAFETY: modulo guarantees valid index
    // eslint-disable-next-line no-non-null-assertion
    const weight = WEIGHTS[i % WEIGHTS.length]!;
    sum += (digit * weight) % 10;
  }
  return String((10 - (sum % 10)) % 10);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 18) {
    return err(
      "INVALID_LENGTH",
      "CLABE must be 18 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CLABE must contain only digits",
    );
  }

  // Verify check digit (last digit).
  const expected = calcCheckDigit(v);
  if (v[17] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "CLABE check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 17)} ${v.slice(17)}`;
};

/** Generate a random valid Mexican CLABE. */
const generate = (): string => {
  const payload = randomDigits(17);
  return payload + calcCheckDigit(payload);
};

/**
 * Mexican CLABE (standardized bank account number).
 *
 * Example sourced from Wikipedia CLABE article.
 */
const clabe: Validator = {
  name: "Mexican Bank Account",
  localName: "Clave Bancaria Estandarizada",
  abbreviation: "CLABE",
  country: "MX",
  entityType: "any",
  lengths: [18] as const,
  examples: ["032180000118359719"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://en.wikipedia.org/wiki/CLABE",
  generate,
};

export default clabe;
export { compact, format, validate, generate };

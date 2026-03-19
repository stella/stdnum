/**
 * NIP (Numer Identyfikacji Podatkowej).
 *
 * Polish VAT number. 10 digits with a weighted
 * checksum. The last digit is the check digit.
 *
 * @see https://www.biznes.gov.pl/en/portal/004124
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/poland-tin.pdf
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

const compact = (value: string): string => {
  const v = clean(value, " -");
  if (v.startsWith("PL") || v.startsWith("pl")) {
    return v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "NIP must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NIP must contain only digits",
    );
  }
  const sum = weightedSum(v.slice(0, 9), WEIGHTS, 11);
  // If remainder is 10, no valid check digit exists
  if (sum >= 10 || sum !== Number(v[9])) {
    return err(
      "INVALID_CHECKSUM",
      "NIP check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `PL${compact(value)}`;


/**
 * Generate a random valid NIP. Retries if the
 * weighted sum mod 11 yields 10 (no valid check
 * digit for that payload).
 */
const generate = (): string => {
  for (;;) {
    const payload = randomDigits(9);
    const sum = weightedSum(payload, WEIGHTS, 11);
    if (sum < 10) {
      return `${payload}${String(sum)}`;
    }
  }
};

/** Polish VAT Number. */
const nip: Validator = {
  name: "Polish VAT Number",
  localName: "Numer Identyfikacji Podatkowej",
  abbreviation: "NIP",
  country: "PL",
  entityType: "company",
  examples: ["2234567895"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nip;
export { compact, format, generate, validate };

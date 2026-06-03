/**
 * VNR (Versicherungsnummer).
 *
 * Austrian social insurance number. 10 digits: 3-digit
 * serial + 1 check digit + 6-digit birth date (DDMMYY).
 * The check digit is computed using a weighted sum
 * mod 11 over the 9 non-check digits.
 *
 * The 6-digit "birth date" field is not always a real
 * calendar date. Sozialversicherung.at documents that
 * persons with unknown date of birth are issued
 * substitute values (01.01. or 01.07.), and that
 * months 13, 14, etc. are issued when the daily serial
 * pool for a given substitute date is exhausted. We
 * therefore do not enforce calendar validity on this
 * field — only the checksum is gating.
 *
 * @see https://de.wikipedia.org/wiki/Sozialversicherungsnummer#%C3%96sterreich
 * @see https://www.sozialversicherung.at/cdscontent/?contentid=10007.820902&viewmode=content
 */

import type { ValidateResult, Validator } from "../types";

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

/**
 * Weights for the 9 non-check digits (positions
 * 0,1,2, then 4,5,6,7,8,9). Check digit is at
 * position 3 and equals the weighted sum mod 11.
 */
const WEIGHTS = [3, 7, 9, 5, 8, 4, 2, 1, 6] as const;

const compact = (value: string): string =>
  clean(value, " -/").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Austrian VNR must be 10 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Austrian VNR must contain only digits",
    );
  }

  // Per sozialversicherung.at, the 3-digit serial
  // (positions 0-2) never starts with zero.
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Austrian VNR serial must not start with zero",
    );
  }

  // Check digit at position 3: weighted sum of the
  // other 9 digits mod 11. If remainder is 10 the
  // number is invalid.
  const digits = v.slice(0, 3) + v.slice(4);
  let sum = 0;
  for (const [i, weight] of WEIGHTS.entries()) {
    sum += Number(digits[i]) * weight;
  }
  const check = sum % 11;
  if (check === 10) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian VNR check digit is invalid (mod 11 " +
        "remainder is 10)",
    );
  }
  if (check !== Number(v[3])) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian VNR check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 4)} ${v.slice(4, 6)}${v.slice(6, 8)}${v.slice(8)}`;
};

/** Generate a random valid Austrian VNR. */
const generate = (): string => {
  for (;;) {
    const serial = randomDigits(3);
    const day = String(randomInt(1, 28)).padStart(2, "0");
    const month = String(randomInt(1, 12)).padStart(2, "0");
    const year = String(randomInt(0, 99)).padStart(2, "0");
    const digits = `${serial}${day}${month}${year}`;

    let sum = 0;
    for (const [i, weight] of WEIGHTS.entries()) {
      sum += Number(digits[i]) * weight;
    }

    const check = sum % 11;
    if (check === 10) continue;
    return `${serial}${String(check)}${day}${month}${year}`;
  }
};

/** Austrian Social Insurance Number. */
const vnr: Validator = {
  name: "Austrian Social Insurance Number",
  localName: "Versicherungsnummer",
  abbreviation: "VNR",
  aliases: [
    "VNR",
    "SVNR",
    "Versicherungsnummer",
    "Sozialversicherungsnummer",
  ] as const,
  candidatePattern: "\\d{4}\\s?\\d{6}",
  country: "AT",
  entityType: "person",
  sourceUrl:
    "https://de.wikipedia.org/wiki/Sozialversicherungsnummer",
  lengths: [10] as const,
  examples: ["1237010180"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vnr;
export { compact, format, generate, validate };

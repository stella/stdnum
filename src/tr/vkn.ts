/**
 * VKN (Vergi Kimlik Numarası, Turkish tax
 * identification number).
 *
 * 10-digit tax ID used for businesses in Turkey.
 * The last digit is a check digit.
 *
 * Check digit algorithm:
 *   For each of the first 9 digits (right to left,
 *   position i = 1..9):
 *     c1 = (digit + i) mod 10
 *     c2 = if c1 != 0: (c1 * 2^i) mod 9, or 9 if
 *          that result is 0
 *     sum += c2
 *   check = (10 - sum) mod 10
 *
 * @see https://www.turkiye.gov.tr/gib-intvrg-vergi-kimlik-numarasi-dogrulama
 * @see https://arthurdejong.org/python-stdnum/doc/1.17/stdnum.tr.vkn
 * @see https://www.gib.gov.tr/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -./");

/**
 * Calculate the check digit for the first 9 digits
 * of a VKN.
 */
const calcCheckDigit = (number: string): string => {
  let s = 0;
  for (let i = 0; i < 9; i++) {
    const pos = 9 - i; // position 1..9 from right
    const c1 = (Number(number[i]) + pos) % 10;
    if (c1 !== 0) {
      const pow = 2 ** pos;
      const c2 = (c1 * pow) % 9 || 9;
      s += c2;
    }
  }
  return String((10 - (s % 10)) % 10);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err("INVALID_LENGTH", "VKN must be 10 digits");
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "VKN must contain only digits",
    );
  }
  if (calcCheckDigit(v) !== v[9]) {
    return err(
      "INVALID_CHECKSUM",
      "VKN check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

/** TR IDs are displayed without separators. */
const format = (value: string): string => compact(value);

/** Generate a random valid Turkish VKN. */
const generate = (): string => {
  const payload = randomDigits(9);
  return payload + calcCheckDigit(payload);
};

/** Turkish Tax Identification Number. */
const vkn: Validator = {
  name: "Turkish Tax ID",
  localName: "Vergi Kimlik Numarası",
  abbreviation: "VKN",
  aliases: ["VKN", "Vergi Kimlik Numarası"] as const,
  candidatePattern: "\\d{10}",
  country: "TR",
  entityType: "company",
  sourceUrl: "https://www.gib.gov.tr/",
  examples: ["4540536920"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vkn;
export { compact, format, validate, generate };

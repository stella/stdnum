/**
 * T.C. Kimlik No.
 * (Türkiye Cumhuriyeti Kimlik Numarası,
 * Turkish personal identification number).
 *
 * 11-digit unique personal ID assigned to every
 * Turkish citizen by MERNİS (Merkezi Nüfus İdaresi
 * Sistemi). The first digit is never zero. The last
 * two digits are check digits.
 *
 * Check digit algorithm:
 *   Let A = sum of digits at odd positions (1,3,5,7,9)
 *   Let B = sum of digits at even positions (2,4,6,8)
 *   d10 = (7 * A - B) mod 10
 *   d11 = (d1 + d2 + ... + d10) mod 10
 *
 * @see https://tckimlik.nvi.gov.tr/
 * @see https://en.wikipedia.org/wiki/Turkish_Identification_Number
 * @see https://www.turkiye.gov.tr/nvi-tckn-dogrulama
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -./");

/**
 * Calculate the two check digits from the first
 * nine digits of a T.C. Kimlik number.
 */
const calcCheckDigits = (number: string): string => {
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 9; i++) {
    const d = Number(number[i]);
    if (i % 2 === 0) {
      oddSum += d;
    } else {
      evenSum += d;
    }
  }
  const d10 = (((7 * oddSum - evenSum) % 10) + 10) % 10;
  const d11 = (oddSum + evenSum + d10) % 10;
  return `${d10}${d11}`;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "T.C. Kimlik number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "T.C. Kimlik number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "T.C. Kimlik number cannot start with 0",
    );
  }
  if (calcCheckDigits(v) !== v.slice(9)) {
    return err(
      "INVALID_CHECKSUM",
      "T.C. Kimlik number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

/** TR IDs are displayed without separators. */
const format = (value: string): string => compact(value);

/** Generate a random valid Turkish T.C. Kimlik No. */
const generate = (): string => {
  const payload = String(randomInt(1, 9)) + randomDigits(8);
  return payload + calcCheckDigits(payload);
};

/** Turkish Personal Identification Number. */
const tckimlik: Validator = {
  name: "Turkish Personal ID",
  localName: "T.C. Kimlik Numarası",
  abbreviation: "T.C. Kimlik",
  country: "TR",
  entityType: "person",
  sourceUrl: "https://www.nvi.gov.tr/",
  examples: ["17291716060"] as const,
  compact,
  format,
  validate,
  generate,
};

export default tckimlik;
export { compact, format, validate, generate };

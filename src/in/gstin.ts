/**
 * GSTIN (Goods and Services Tax Identification
 * Number, India).
 *
 * 15 characters: 2-digit state code + 10-char PAN +
 * 1 entity number (1-9, A-Z) + "Z" + 1 check digit.
 * Check digit uses the Luhn mod 36 algorithm.
 *
 * @see https://en.wikipedia.org/wiki/Goods_and_Services_Tax_Identification_Number
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { charValue } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const GSTIN_RE =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

/** Valid Indian state/UT codes: 01-37. */
const VALID_STATE_CODES = new Set([
  "01", "02", "03", "04", "05", "06", "07", "08",
  "09", "10", "11", "12", "13", "14", "15", "16",
  "17", "18", "19", "20", "21", "22", "23", "24",
  "25", "26", "27", "28", "29", "30", "31", "32",
  "33", "34", "35", "36", "37",
]);

const BASE = 36;

/**
 * Luhn mod 36 checksum over the full GSTIN.
 * Returns 0 for a valid number.
 */
const luhn36Checksum = (value: string): number => {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let v = charValue(value[i]!);
    if (double) {
      v *= 2;
      sum += Math.floor(v / BASE) + (v % BASE);
    } else {
      sum += v;
    }
    double = !double;
  }
  return sum % BASE;
};

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "GSTIN must be 15 characters",
    );
  }
  if (!GSTIN_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "GSTIN format is invalid",
    );
  }
  const stateCode = v.slice(0, 2);
  if (
    !VALID_STATE_CODES.has(stateCode) ||
    v[12] === "0"
  ) {
    return err(
      "INVALID_COMPONENT",
      "GSTIN state code or entity number is invalid",
    );
  }
  if (luhn36Checksum(v) !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "GSTIN check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Indian Goods and Services Tax ID. */
const gstin: Validator = {
  name: "Indian Goods and Services Tax ID",
  localName:
    "Goods and Services Tax Identification Number",
  abbreviation: "GSTIN",
  country: "IN",
  entityType: "company",
  lengths: [15],
  examples: ["27AAPFU0939F1ZV", "29AAGCB7383J1Z4"],
  description:
    "15-character tax identifier for GST-registered businesses",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Goods_and_Services_Tax_Identification_Number",
  compact,
  format,
  validate,
};

export default gstin;
export { compact, format, validate };

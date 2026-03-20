/**
 * IRD number (New Zealand Inland Revenue Department
 * number, Te Tari Take).
 *
 * 8 or 9 digit number with a weighted checksum.
 * Uses primary weights, falling back to secondary
 * weights if the primary check yields 10.
 *
 * @see https://www.ird.govt.nz/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const PRIMARY_WEIGHTS = [
  3, 2, 7, 6, 5, 4, 3, 2,
] as const;

const SECONDARY_WEIGHTS = [
  7, 4, 3, 2, 5, 2, 7, 6,
] as const;

/**
 * Calculate the check digit for an IRD number.
 * The input should be the number without the check
 * digit, zero-padded to 8 digits.
 */
const calcCheckDigit = (payload: string): number => {
  const padded = payload.padStart(8, "0");
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += PRIMARY_WEIGHTS[i]! * Number(padded[i]);
  }
  let remainder = (-sum % 11 + 11) % 11;
  if (remainder !== 10) return remainder;

  sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += SECONDARY_WEIGHTS[i]! * Number(padded[i]);
  }
  remainder = (-sum % 11 + 11) % 11;
  // remainder === 10 means no valid check digit exists
  return remainder === 10 ? -1 : remainder;
};

const compact = (value: string): string => {
  let v = clean(value, " -").toUpperCase();
  if (v.startsWith("NZ")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "IRD number must be 8 or 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "IRD number must contain only digits",
    );
  }
  const num = Number(v);
  if (num < 10_000_000 || num >= 150_000_000) {
    return err(
      "INVALID_COMPONENT",
      "IRD number out of valid range",
    );
  }
  const payload = v.slice(0, -1);
  const expected = calcCheckDigit(payload);
  if (expected === -1) {
    return err(
      "INVALID_COMPONENT",
      "IRD number cannot have a valid check digit",
    );
  }
  if (expected !== Number(v[v.length - 1])) {
    return err(
      "INVALID_CHECKSUM",
      "IRD check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const last6 = v.slice(-6);
  const prefix = v.slice(0, -6);
  return `${prefix}-${last6.slice(0, 3)}-${last6.slice(3)}`;
};

/** New Zealand IRD Number. */
const ird: Validator = {
  name: "IRD Number",
  localName: "IRD Number",
  abbreviation: "IRD",
  country: "NZ",
  entityType: "any",
  compact,
  format,
  validate,
  description:
    "New Zealand Inland Revenue Department number",
  sourceUrl: "https://www.ird.govt.nz/",
  lengths: [8, 9] as const,
  examples: ["49091850", "136410132"] as const,
};

export default ird;
export { compact, format, validate };

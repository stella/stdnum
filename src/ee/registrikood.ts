/**
 * Registrikood (Estonian company registration code).
 *
 * 8 digits. First digit must be 1, 7, 8, or 9.
 * Two-pass checksum (same algorithm as EE IK).
 *
 * @see https://www.rik.ee/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { twoPassCheck } from "./ik";
import { randomDigits, randomInt } from "#util/generate";

const VALID_FIRST = new Set(["1", "7", "8", "9"]);

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Estonian Registrikood must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Estonian Registrikood must contain only digits",
    );
  }
  if (!VALID_FIRST.has(v[0])) {
    return err(
      "INVALID_COMPONENT",
      "Estonian Registrikood must start with 1, 7, 8, or 9",
    );
  }
  const check = twoPassCheck(v.slice(0, 7));
  if (check !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "Estonian Registrikood check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Estonian Registrikood. */
const generate = (): string => {
  const firsts = [1, 7, 8, 9];
  const first = String(firsts[randomInt(0, 3)]!);
  const payload = first + randomDigits(6);
  return payload + String(twoPassCheck(payload));
};

/** Estonian Company Registration Code. */
const registrikood: Validator = {
  name: "Estonian Company Registration Code",
  localName: "Registrikood",
  abbreviation: "Registrikood",
  country: "EE",
  entityType: "company",
  sourceUrl: "https://www.rik.ee/",
  examples: ["12345678"] as const,
  compact,
  format,
  validate,
  generate,
};

export default registrikood;
export { compact, format, validate, generate };

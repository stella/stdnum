/**
 * SIN (Canadian Social Insurance Number).
 *
 * 9-digit identifier with Luhn checksum. First
 * digit cannot be 0 or 8.
 *
 * @see https://www.canada.ca/en/employment-social-development/services/sin.html
 * @see https://en.wikipedia.org/wiki/Social_Insurance_Number
 */

import { luhnValidate, luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "SIN must contain only digits",
    );
  }
  if (v.length !== 9) {
    return err("INVALID_LENGTH", "SIN must be 9 digits");
  }
  if (v[0] === "0" || v[0] === "8") {
    return err(
      "INVALID_COMPONENT",
      "SIN cannot start with 0 or 8",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "SIN Luhn check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6)}`;
  }
  return v;
};

/** Generate a random valid Canadian SIN. */
const generate = (): string => {
  const first = String(randomInt(1, 7));
  const payload = first + randomDigits(7);
  const cs = luhnChecksum(payload + "0");
  return payload + String((10 - cs) % 10);
};

/** Canadian Social Insurance Number. */
const sin: Validator = {
  name: "Social Insurance Number",
  localName: "Social Insurance Number",
  abbreviation: "SIN",
  aliases: [
    "SIN",
    "Social Insurance Number",
    "NAS",
  ] as const,
  candidatePattern: "\\d{3}-?\\d{3}-?\\d{3}",
  country: "CA",
  entityType: "person",
  sourceUrl: 
    "https://www.canada.ca/en/employment-social-development/services/sin.html",
  examples: ["123456782"] as const,
  compact,
  format,
  validate,
  generate,
};

export default sin;
export { compact, format, validate, generate };

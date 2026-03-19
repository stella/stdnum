/**
 * Credit card number validation (Luhn algorithm).
 *
 * Validates card numbers using the Luhn checksum
 * (ISO/IEC 7812-1). Supports Visa, Mastercard,
 * Amex, Discover, and other networks (13-19
 * digits).
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "./types";

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 13 || v.length > 19) {
    return err(
      "INVALID_LENGTH",
      "Credit card number must be 13-19 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Credit card number must contain only digits",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Credit card number fails Luhn check",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  // Amex: 4-6-5 grouping
  if (v.length === 15 && v[0] === "3") {
    return `${v.slice(0, 4)} ${v.slice(4, 10)} ${v.slice(10)}`;
  }
  // Standard: groups of 4
  const groups: string[] = [];
  for (let i = 0; i < v.length; i += 4) {
    groups.push(v.slice(i, i + 4));
  }
  return groups.join(" ");
};

/** Credit Card Number (Luhn). */
const creditCard: Validator = {
  name: "Credit Card Number",
  localName: "Credit Card Number",
  abbreviation: "CC",
  entityType: "any",
  examples: [
    "4111111111111111",
    "5500000000000004",
  ] as const,
  compact,
  format,
  validate,
};

export default creditCard;
export { compact, format, validate };

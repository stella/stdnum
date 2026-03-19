/**
 * Generic Luhn checksum validation.
 *
 * Validates any digit string using the Luhn
 * algorithm (ISO/IEC 7812-1). No length
 * restriction. For credit card validation
 * (13-19 digits), use `creditcard` instead.
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
  if (v.length < 1) {
    return err("INVALID_LENGTH", "Value must not be empty");
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Value must contain only digits",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Luhn check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generic Luhn Validator. */
const luhn: Validator = {
  name: "Luhn",
  localName: "Luhn",
  abbreviation: "Luhn",
  entityType: "any",
  examples: ["4111111111111111", "18"] as const,
  compact,
  format,
  validate,
};

export default luhn;
export { compact, format, validate };

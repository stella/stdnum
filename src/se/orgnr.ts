/**
 * Organisationsnummer (Swedish organization number).
 *
 * 10 digits, third digit >= 2. Standard Luhn checksum.
 * Display format: NNNNNN-NNNN.
 *
 * @see https://www.skatteverket.se/
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Swedish Organisationsnummer must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Swedish Organisationsnummer must contain only digits",
    );
  }
  if (v[2] < "2") {
    return err(
      "INVALID_COMPONENT",
      "Swedish Organisationsnummer third digit must be >= 2",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Swedish Organisationsnummer Luhn check failed",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)}-${v.slice(6)}`;
};

/** Swedish Organization Number. */
const orgnr: Validator = {
  name: "Swedish Organization Number",
  localName: "Organisationsnummer",
  abbreviation: "Orgnr",
  country: "SE",
  entityType: "company",
  examples: ["1234567897"] as const,
  compact,
  format,
  validate,
};

export default orgnr;
export { compact, format, validate };

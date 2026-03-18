/**
 * BTW/TVA/MWSt (Belgian VAT number).
 *
 * 10 digits, first must be 0 or 1.
 * Checksum: (first 8 digits + last 2) % 97 === 0.
 *
 * @see https://www.vatify.eu/belgium-vat-number.html
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("BE") || v.startsWith("be")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Belgian VAT number must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Belgian VAT number must contain only digits",
    );
  }
  if (v[0] !== "0" && v[0] !== "1") {
    return err(
      "INVALID_COMPONENT",
      "Belgian VAT number must start with 0 or 1",
    );
  }
  const front = Number.parseInt(v.slice(0, 8), 10);
  const check = Number.parseInt(v.slice(8, 10), 10);
  if ((front + check) % 97 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Belgian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `BE${v}`;
};

/** Belgian VAT Number. */
const vat: Validator = {
  name: "Belgian VAT Number",
  localName: "BTW-identificatienummer",
  abbreviation: "BTW",
  country: "BE",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

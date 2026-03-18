/**
 * BTW (Dutch VAT number).
 *
 * 12 characters: 9 digits + "B" + 2 digits.
 * Mod 97 check: convert "NL" + number to numeric
 * (N=23, L=21, B=11), mod 97 === 1.
 *
 * @see https://www.vatify.eu/netherlands-vat-number.html
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
  if (v.startsWith("NL") || v.startsWith("nl")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

/**
 * Compute mod 97 of a string containing digits and
 * uppercase letters (A=10, B=11, ..., Z=35).
 */
const mod97 = (value: string): number => {
  let remainder = 0;
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      // Digit
      remainder = (remainder * 10 + (code - 48)) % 97;
    } else if (code >= 65 && code <= 90) {
      // Letter: two decimal digits (A=10, ..., Z=35)
      const num = code - 55;
      remainder = (remainder * 100 + num) % 97;
    }
  }
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Dutch VAT number must be 12 characters",
    );
  }
  if (!isdigits(v.slice(0, 9))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must start with 9 digits",
    );
  }
  if (v[9] !== "B") {
    return err(
      "INVALID_COMPONENT",
      "Dutch VAT number digit 10 must be B",
    );
  }
  if (!isdigits(v.slice(10, 12))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must end with 2 digits",
    );
  }
  // Mod 97 check: "NL" + v must mod 97 === 1
  if (mod97(`NL${v}`) !== 1) {
    return err(
      "INVALID_CHECKSUM",
      "Dutch VAT number mod 97 check failed",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `NL${compact(value)}`;

/** Dutch VAT Number. */
const vat: Validator = {
  name: "Dutch VAT Number",
  localName: "BTW-identificatienummer",
  abbreviation: "BTW",
  country: "NL",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

/**
 * VAT (Maltese VAT number).
 *
 * 8 digits, no leading 0.
 * Weights [3,4,6,7,8,9,10,1], sum % 37 === 0.
 *
 * @see https://www.vatify.eu/malta-vat-number.html
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

const WEIGHTS = [3, 4, 6, 7, 8, 9, 10, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("MT") || v.startsWith("mt")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Maltese VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Maltese VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Maltese VAT number cannot start with 0",
    );
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  if (sum % 37 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Maltese VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `MT${compact(value)}`;

/** Maltese VAT Number. */
const vat: Validator = {
  name: "Maltese VAT Number",
  localName: "VAT Registration Number",
  abbreviation: "VAT",
  country: "MT",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

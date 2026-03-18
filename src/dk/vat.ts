/**
 * CVR (Danish VAT / business registration number).
 *
 * 8 digits, no leading 0.
 * Weights [2,7,6,5,4,3,2,1], sum % 11 === 0.
 *
 * @see https://www.vatify.eu/denmark-vat-number.html
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

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("DK") || v.startsWith("dk")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Danish VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Danish VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Danish VAT number cannot start with 0",
    );
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  if (sum % 11 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Danish VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `DK${compact(value)}`;

/** Danish VAT Number. */
const vat: Validator = {
  name: "Danish VAT Number",
  localName: "Momsregistreringsnummer",
  abbreviation: "CVR",
  country: "DK",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

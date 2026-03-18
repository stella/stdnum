/**
 * KMKR (Estonian VAT number).
 *
 * 9 digits. Weights [3,7,1,3,7,1,3,7,1],
 * sum % 10 === 0.
 *
 * @see https://www.vatify.eu/estonia-vat-number.html
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

const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("EE") || v.startsWith("ee")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Estonian VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Estonian VAT number must contain only digits",
    );
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  if (sum % 10 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Estonian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `EE${compact(value)}`;

/** Estonian VAT Number. */
const vat: Validator = {
  name: "Estonian VAT Number",
  localName: "Käibemaksukohustuslase number",
  abbreviation: "KMKR",
  country: "EE",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

/**
 * ANUM (Hungarian VAT number).
 *
 * 8 digits. Weights [9,7,3,1,9,7,3,1],
 * sum % 10 === 0.
 *
 * @see https://www.vatify.eu/hungary-vat-number.html
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

const WEIGHTS = [9, 7, 3, 1, 9, 7, 3, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("HU") || v.startsWith("hu")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Hungarian VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Hungarian VAT number must contain only digits",
    );
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  if (sum % 10 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Hungarian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `HU${compact(value)}`;

/** Hungarian VAT Number. */
const vat: Validator = {
  name: "Hungarian VAT Number",
  localName: "Adószám",
  abbreviation: "ANUM",
  country: "HU",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

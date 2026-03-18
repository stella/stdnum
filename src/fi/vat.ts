/**
 * ALV nro (Finnish VAT number).
 *
 * 8 digits. Weights [7,9,10,5,8,4,2,1],
 * sum % 11 === 0.
 *
 * @see https://www.vatify.eu/finland-vat-number.html
 * @see https://www.ytj.fi/en/index/businessid.html
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

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("FI") || v.startsWith("fi")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Finnish VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Finnish VAT number must contain only digits",
    );
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  if (sum % 11 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Finnish VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `FI${compact(value)}`;

/** Finnish VAT Number. */
const vat: Validator = {
  name: "Finnish VAT Number",
  localName: "Arvonlisäveronumero",
  abbreviation: "ALV nro",
  country: "FI",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

/**
 * PVN (Latvian VAT number).
 *
 * 11 digits. Legal entities (first digit > 3):
 * weights [9,1,4,8,3,10,2,5,7,6,1], sum % 11 === 3.
 * Personal (first digit <= 3): 11-digit format only.
 *
 * @see https://www.vatify.eu/latvia-vat-number.html
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

const WEIGHTS = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("LV") || v.startsWith("lv")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Latvian VAT number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Latvian VAT number must contain only digits",
    );
  }
  const first = Number(v[0]);
  // Legal entity: first digit > 3
  if (first > 3) {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += WEIGHTS[i] * Number(v[i]);
    }
    if (sum % 11 !== 3) {
      return err(
        "INVALID_CHECKSUM",
        "Latvian VAT number check digit mismatch",
      );
    }
  }
  // Personal numbers (first digit <= 3):
  // just validate length/format (done above)
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `LV${compact(value)}`;

/** Latvian VAT Number. */
const vat: Validator = {
  name: "Latvian VAT Number",
  localName: "PVN reģistrācijas numurs",
  abbreviation: "PVN",
  country: "LV",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

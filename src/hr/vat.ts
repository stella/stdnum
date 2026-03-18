/**
 * OIB (Croatian VAT number).
 *
 * 11 digits. ISO 7064 Mod 11,10 checksum.
 *
 * @see https://www.vatify.eu/croatia-vat-number.html
 * @see https://www.porezna-uprava.hr/
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
  if (v.startsWith("HR") || v.startsWith("hr")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Croatian VAT number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Croatian VAT number must contain only digits",
    );
  }
  // ISO 7064 Mod 11,10
  let product = 10;
  for (let i = 0; i < 10; i++) {
    let sum = (Number(v[i]) + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = (11 - product) % 10;
  if (check !== Number(v[10])) {
    return err(
      "INVALID_CHECKSUM",
      "Croatian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `HR${compact(value)}`;

/** Croatian VAT Number. */
const vat: Validator = {
  name: "Croatian VAT Number",
  localName: "Osobni identifikacijski broj",
  abbreviation: "OIB",
  country: "HR",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

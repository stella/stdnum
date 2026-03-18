/**
 * CIF/CUI (Romanian VAT number).
 *
 * 2-10 digits. Pad to 10, weights
 * [7,5,3,2,1,7,5,3,2], check =
 * (10 * sum) % 11 % 10 === last digit.
 *
 * @see https://www.vatify.eu/romania-vat-number.html
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

const WEIGHTS = [7, 5, 3, 2, 1, 7, 5, 3, 2];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("RO") || v.startsWith("ro")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 2 || v.length > 10) {
    return err(
      "INVALID_LENGTH",
      "Romanian VAT number must be 2 to 10 digits",
    );
  }
  if (!isdigits(v) || v[0] === "0") {
    return err(
      "INVALID_FORMAT",
      "Romanian VAT number must contain only digits " +
        "and must not start with 0",
    );
  }
  // Pad to 10 digits
  const padded = v.padStart(10, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += WEIGHTS[i] * Number(padded[i]);
  }
  const check = ((sum * 10) % 11) % 10;
  if (check !== Number(padded[9])) {
    return err(
      "INVALID_CHECKSUM",
      "Romanian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `RO${compact(value)}`;

/** Romanian VAT Number. */
const vat: Validator = {
  name: "Romanian VAT Number",
  localName: "Cod de Identificare Fiscală",
  abbreviation: "CIF",
  country: "RO",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

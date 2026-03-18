/**
 * NIF (Portuguese VAT number).
 *
 * 9 digits, no leading 0.
 * Weights [9,8,7,6,5,4,3,2],
 * check = (11 - sum) % 11 % 10 === d[8].
 *
 * @see https://www.vatify.eu/portugal-vat-number.html
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

const WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("PT") || v.startsWith("pt")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Portuguese VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Portuguese VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Portuguese VAT number cannot start with 0",
    );
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += WEIGHTS[i] * Number(v[i]);
  }
  const check = ((11 - (sum % 11)) % 11) % 10;
  if (check !== Number(v[8])) {
    return err(
      "INVALID_CHECKSUM",
      "Portuguese VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `PT${compact(value)}`;

/** Portuguese VAT Number. */
const vat: Validator = {
  name: "Portuguese VAT Number",
  localName: "Número de Identificação Fiscal",
  abbreviation: "NIF",
  country: "PT",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

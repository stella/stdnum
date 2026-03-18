/**
 * USt-IdNr. (Umsatzsteuer-Identifikationsnummer).
 *
 * German VAT identification number. Format:
 * "DE" + 9 digits. The last digit is a check
 * digit computed using ISO 7064 Mod 11,10.
 */

import { clean } from "../_util/clean";
import { isdigits } from "../_util/strings";
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
  const v = clean(value, " -/");
  if (v.startsWith("DE") || v.startsWith("de")) {
    return v.slice(2);
  }
  return v;
};

/**
 * ISO 7064 Mod 11,10 check digit algorithm.
 * Used by German VAT and several others.
 */
const mod1110validate = (value: string): boolean => {
  let product = 10;
  for (let i = 0; i < value.length - 1; i++) {
    let sum = (Number(value[i]) + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = (11 - product) % 10;
  return check === Number(value[value.length - 1]);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "German VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "German VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "German VAT number cannot start with 0",
    );
  }
  if (!mod1110validate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "German VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `DE${compact(value)}`;

/** German VAT Identification Number. */
const vat: Validator = {
  name: "German VAT Number",
  localName: "Umsatzsteuer-Identifikationsnummer",
  abbreviation: "USt-IdNr.",
  country: "DE",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

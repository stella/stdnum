/**
 * IČ DPH (Identifikačné číslo pre daň z
 * pridanej hodnoty).
 *
 * Slovak VAT number. Format: "SK" + 10 digits.
 * The 10-digit number must be divisible by 11.
 * First digit is 1-9.
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
  const v = clean(value, " -");
  if (v.startsWith("SK") || v.startsWith("sk")) {
    return v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Slovak VAT number must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Slovak VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Slovak VAT number cannot start with 0",
    );
  }
  if (Number(v) % 11 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Slovak VAT number is not divisible by 11",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `SK${compact(value)}`;

/** Slovak VAT Number. */
const dic: Validator = {
  name: "Slovak VAT Number",
  localName:
    "Identifikačné číslo pre daň z pridanej hodnoty",
  abbreviation: "IČ DPH",
  country: "SK",
  entityType: "company",
  compact,
  format,
  validate,
};

export default dic;
export { compact, format, validate };

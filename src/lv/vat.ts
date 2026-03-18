/**
 * PVN (Latvian VAT number).
 *
 * 11 digits. Legal entities (first digit > 3):
 * weights [9,1,4,8,3,10,2,5,7,6,1], sum % 11 === 3.
 * Personal (first digit <= 3): 11-digit format only.
 *
 * @see https://www.vatify.eu/latvia-vat-number.html
 * @see https://www.vid.gov.lv/en
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

const PERS_WEIGHTS = [10, 5, 8, 4, 2, 1, 6, 3, 7, 9];

const checkPersonal = (v: string): boolean => {
  let sum = 1;
  for (let i = 0; i < 10; i++) {
    sum += PERS_WEIGHTS[i] * Number(v[i]);
  }
  return (sum % 11) % 10 === Number(v[10]);
};

const validateBirthDate = (v: string): boolean => {
  const day = Number(v.slice(0, 2));
  const month = Number(v.slice(2, 4));
  const year2 = Number(v.slice(4, 6));
  const century = Number(v[6]);
  const fullYear = 1800 + century * 100 + year2;
  const date = new Date(fullYear, month - 1, day);
  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
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
  } else if (v.startsWith("32")) {
    // New-format personal code (from July 2017),
    // no birth date; checksum only
    if (!checkPersonal(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Latvian personal code check digit mismatch",
      );
    }
  } else {
    // Old-format personal code: first 6 digits encode
    // birth date as DDMMYY, digit 7 encodes century
    if (!validateBirthDate(v)) {
      return err(
        "INVALID_COMPONENT",
        "Latvian personal code has invalid birth date",
      );
    }
    if (!checkPersonal(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Latvian personal code check digit mismatch",
      );
    }
  }
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

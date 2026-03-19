/**
 * UID (Unternehmens-Identifikationsnummer).
 *
 * Swiss business identification number. 12 characters:
 * "CHE" prefix + 9 digits. Check digit uses weights
 * [5,4,3,2,7,6,5,4] on the first 8 digits.
 *
 * @see https://www.uid.admin.ch/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4] as const;

const compact = (value: string): string => {
  let v = clean(value, " -./");
  if (v.startsWith("CHE") || v.startsWith("che")) {
    v = "CHE" + v.slice(3);
  }
  return v.toUpperCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Swiss UID must be CHE + 9 digits",
    );
  }
  if (!v.startsWith("CHE")) {
    return err(
      "INVALID_COMPONENT",
      "Swiss UID must start with CHE",
    );
  }
  const digits = v.slice(3);
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Swiss UID must be CHE + 9 digits",
    );
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(digits[i]) * WEIGHTS[i];
  }
  const check = (11 - (sum % 11)) % 11;
  if (check === 10) {
    return err(
      "INVALID_CHECKSUM",
      "Swiss UID check digit is invalid",
    );
  }
  if (check !== Number(digits[8])) {
    return err(
      "INVALID_CHECKSUM",
      "Swiss UID check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const d = v.slice(3);
  return `CHE-${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
};

/** Swiss Business Identification Number. */
const uid: Validator = {
  name: "Swiss Business ID",
  localName: "Unternehmens-Identifikationsnummer",
  abbreviation: "UID",
  country: "CH",
  entityType: "company",
  compact,
  format,
  validate,
};

export default uid;
export { compact, format, validate };

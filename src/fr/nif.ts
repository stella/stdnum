/**
 * NIF (Numéro d'Identification Fiscale).
 *
 * French tax identification number. 13 digits;
 * first digit is 0-3. Last 3 digits are a
 * check: first_10_digits % 511 == last_3.
 *
 * @see https://www.impots.gouv.fr/
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

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "French NIF must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "French NIF must contain only digits",
    );
  }
  const first = v[0];
  if (
    first !== "0" &&
    first !== "1" &&
    first !== "2" &&
    first !== "3"
  ) {
    return err(
      "INVALID_COMPONENT",
      "French NIF must start with 0-3",
    );
  }
  const front = Number(v.slice(0, 10));
  const check = Number(v.slice(10));
  if (front % 511 !== check) {
    return err(
      "INVALID_CHECKSUM",
      "French NIF check digits mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)} ${v.slice(2, 4)} ${v.slice(4, 7)} ${v.slice(7, 10)} ${v.slice(10)}`;
};

/** French Tax Identification Number. */
const nif: Validator = {
  name: "French Tax ID",
  localName: "Numéro d'Identification Fiscale",
  abbreviation: "NIF",
  country: "FR",
  entityType: "person",
  compact,
  format,
  validate,
};

export default nif;
export { compact, format, validate };

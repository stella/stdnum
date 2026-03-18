/**
 * DIČ (Daňové identifikační číslo).
 *
 * Czech tax identification number / VAT number.
 * Format: "CZ" prefix + 8, 9, or 10 digits.
 * - 8 digits: company (same checksum as IČO,
 *   but first digit cannot be 9)
 * - 9 digits starting with 6: special entity
 * - 9-10 digits: individual (birth number)
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";
import { validate as validateRc } from "./rc";

const ICO_WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const compact = (value: string): string => {
  const v = clean(value, " -");
  if (v.startsWith("CZ") || v.startsWith("cz")) {
    return v.slice(2);
  }
  return v;
};

const checkLegal = (value: string): boolean => {
  const sum = weightedSum(
    value.slice(0, 7),
    ICO_WEIGHTS,
    11,
  );
  const v11 = (11 - sum) % 11;
  const check = v11 === 0 ? 1 : v11 % 10;
  return check === Number(value[7]);
};

const checkSpecial = (value: string): boolean => {
  // Skip the leading "6"; check digits 1..7
  const sum = weightedSum(
    value.slice(1, 8),
    [8, 7, 6, 5, 4, 3, 2],
    11,
  );
  const check =
    (((8 - ((((10 - sum) % 11) + 11) % 11)) % 10) + 10) %
    10;
  return check === Number(value[8]);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 8 || v.length > 10) {
    return err(
      "INVALID_LENGTH",
      "DIČ must be 8-10 digits (without CZ prefix)",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "DIČ must contain only digits",
    );
  }

  // 8-digit: legal entity (IČO-like checksum)
  if (v.length === 8) {
    if (v[0] === "9") {
      return err(
        "INVALID_COMPONENT",
        "8-digit DIČ cannot start with 9",
      );
    }
    if (!checkLegal(v)) {
      return err(
        "INVALID_CHECKSUM",
        "DIČ check digit does not match",
      );
    }
    return { valid: true, compact: v };
  }

  // 9-digit starting with 6: special entity
  if (v.length === 9 && v[0] === "6") {
    if (!checkSpecial(v)) {
      return err(
        "INVALID_CHECKSUM",
        "DIČ special entity check digit mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  // 9-10 digit: birth number
  return validateRc(v);
};

const format = (value: string): string =>
  `CZ${compact(value)}`;

/** Czech VAT Number. */
const dic: Validator = {
  name: "Czech VAT Number",
  localName: "Daňové identifikační číslo",
  abbreviation: "DIČ",
  country: "CZ",
  entityType: "any",
  compact,
  format,
  validate,
};

export default dic;
export { compact, format, validate };

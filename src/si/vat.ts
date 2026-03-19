/**
 * DDV (Slovenian VAT number).
 *
 * 8 digits, no leading 0.
 * Weights [8,7,6,5,4,3,2], check = 11 - sum % 11.
 * If check === 10 invalid; if 11 the number is
 * invalid (spec says no valid number yields 11).
 *
 * @see https://www.vatify.eu/slovenia-vat-number.html
 * @see https://spot.gov.si/en/info/taxes/value-added-tax-vat
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("SI") || v.startsWith("si")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Slovenian VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Slovenian VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Slovenian VAT number cannot start with 0",
    );
  }
  const remainder = weightedSum(v.slice(0, 7), WEIGHTS, 11);
  const check = 11 - remainder;
  if (check === 11) {
    return err(
      "INVALID_CHECKSUM",
      "Slovenian VAT number check digit invalid",
    );
  }
  if (check === 10) {
    // check digit 10 means 0
    if (Number(v[7]) !== 0) {
      return err(
        "INVALID_CHECKSUM",
        "Slovenian VAT number check digit mismatch",
      );
    }
  } else if (check !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "Slovenian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `SI${compact(value)}`;

/** Slovenian VAT Number. */
const vat: Validator = {
  name: "Slovenian VAT Number",
  localName: "Davčna številka",
  abbreviation: "DDV",
  country: "SI",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

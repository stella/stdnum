/**
 * REGON (Rejestr Gospodarki Narodowej).
 *
 * Polish statistical identification number for
 * businesses. 9 digits for national entities,
 * 14 digits for local units (9 + 5 extension).
 * Both have weighted checksums.
 *
 * @see https://bip.stat.gov.pl/en/regon/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS_9 = [8, 9, 2, 3, 4, 5, 6, 7] as const;
const WEIGHTS_14 = [
  2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8,
] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 14) {
    return err(
      "INVALID_LENGTH",
      "REGON must be 9 or 14 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "REGON must contain only digits",
    );
  }

  // Validate 9-digit base
  const sum9 = weightedSum(v.slice(0, 8), WEIGHTS_9, 11);
  if (String(sum9 % 10) !== v[8]) {
    return err(
      "INVALID_CHECKSUM",
      "REGON check digit does not match",
    );
  }

  // Validate 14-digit extension
  if (v.length === 14) {
    const sum14 = weightedSum(
      v.slice(0, 13),
      WEIGHTS_14,
      11,
    );
    if (String(sum14 % 10) !== v[13]) {
      return err(
        "INVALID_CHECKSUM",
        "REGON local unit check digit mismatch",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Polish Statistical Identification Number. */
const regon: Validator = {
  name: "Polish Business Register Number",
  localName: "Rejestr Gospodarki Narodowej",
  abbreviation: "REGON",
  country: "PL",
  entityType: "company",
  compact,
  format,
  validate,
};

export default regon;
export { compact, format, validate };

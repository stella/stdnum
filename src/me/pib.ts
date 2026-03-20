/**
 * PIB (Poreski identifikacioni broj).
 *
 * Montenegrin tax identification number. 8 digits with
 * a weighted mod 11 checksum.
 *
 * @see https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/me/pib.py
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "PIB must be exactly 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "PIB must contain only digits",
    );
  }

  const total = weightedSum(v.slice(0, 7), WEIGHTS, 11);
  const check = ((11 - total) % 11) % 10;
  if (check !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "PIB check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Montenegrin Tax Identification Number. */
const pib: Validator = {
  name: "Montenegrin Tax ID",
  localName: "Poreski identifikacioni broj",
  abbreviation: "PIB",
  country: "ME",
  entityType: "any",
  lengths: [8] as const,
  examples: ["02655284"] as const,
  compact,
  format,
  validate,
};

export default pib;
export { compact, format, validate };

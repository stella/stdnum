/**
 * IČO (Identifikační číslo osoby).
 *
 * Czech company identification number. 8 digits
 * with a weighted checksum. Assigned by the Czech
 * Statistical Office.
 *
 * @see https://www.czso.cz/
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
      "IČO must be exactly 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "IČO must contain only digits",
    );
  }
  const sum = weightedSum(v.slice(0, 7), WEIGHTS, 11);
  const v11 = (11 - sum) % 11;
  const check = v11 === 0 ? 1 : v11 % 10;
  if (check !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "IČO check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Czech Company Identification Number. */
const ico: Validator = {
  name: "Czech Company ID",
  localName: "Identifikační číslo osoby",
  abbreviation: "IČO",
  country: "CZ",
  entityType: "company",
  description:
    "8-digit company ID assigned by the Czech Statistical Office",
  sourceUrl: "https://www.czso.cz/",
  lengths: [8] as const,
  examples: ["25123891", "27074358"] as const,
  compact,
  format,
  validate,
};

export default ico;
export { compact, format, validate };

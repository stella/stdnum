/**
 * CNP (Cod Numeric Personal).
 *
 * Romanian personal identification number. 13 digits
 * encoding gender/century, date of birth, county code,
 * serial number, and a check digit.
 *
 * @see https://ro.wikipedia.org/wiki/Cod_numeric_personal
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [
  2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9,
] as const;

const VALID_COUNTIES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50, 51, 52, 70, 80, 81, 82, 83,
]);

const centuryMap: Record<number, number> = {
  1: 1900,
  2: 1900,
  3: 1800,
  4: 1800,
  5: 2000,
  6: 2000,
  7: 1900, // foreign residents
  8: 1900, // foreign residents
};

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "CNP must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CNP must contain only digits",
    );
  }

  const g = Number(v[0]);
  if (g < 1 || g > 9) {
    return err(
      "INVALID_COMPONENT",
      "CNP gender/century digit is invalid",
    );
  }

  const century = centuryMap[g] ?? 1900;
  const yy = Number(v.slice(1, 3));
  const mm = Number(v.slice(3, 5));
  const dd = Number(v.slice(5, 7));
  const year = century + yy;

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "CNP contains an invalid date",
    );
  }

  const county = Number(v.slice(7, 9));
  if (!VALID_COUNTIES.has(county)) {
    return err(
      "INVALID_COMPONENT",
      "CNP county code is invalid",
    );
  }

  const sum = weightedSum(v.slice(0, 12), WEIGHTS, 11);
  const check = sum === 10 ? 1 : sum;
  if (check !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "CNP check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Romanian Personal Identification Number. */
const cnp: Validator = {
  name: "Romanian Personal ID",
  localName: "Cod Numeric Personal",
  abbreviation: "CNP",
  country: "RO",
  entityType: "person",
  compact,
  format,
  validate,
};

export default cnp;
export { compact, format, validate };

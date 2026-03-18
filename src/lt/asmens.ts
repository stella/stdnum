/**
 * Asmens kodas (Personal Code).
 *
 * Lithuanian personal identification number. 11 digits
 * with the same structure as the Estonian Isikukood:
 * gender/century digit, YYMMDD, 3-digit serial, and
 * a two-pass weighted checksum.
 *
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/lithuania-tin.pdf
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import { twoPassCheck } from "../ee/ik";
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

const isValidDate = (
  year: number,
  month: number,
  day: number,
): boolean => {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Asmens kodas must be exactly 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Asmens kodas must contain only digits",
    );
  }

  const g = Number(v[0]);
  if (g < 1 || g > 9) {
    return err(
      "INVALID_COMPONENT",
      "Asmens kodas gender/century digit is invalid",
    );
  }

  // Digit 9 indicates a special case where the birth
  // date is not encoded; skip date validation.
  if (g !== 9) {
    const centuryMap: Record<number, number> = {
      1: 1800,
      2: 1800,
      3: 1900,
      4: 1900,
      5: 2000,
      6: 2000,
      7: 2100,
      8: 2100,
    };
    const century = centuryMap[g] ?? 1900;
    const yy = Number(v.slice(1, 3));
    const mm = Number(v.slice(3, 5));
    const dd = Number(v.slice(5, 7));
    const year = century + yy;

    if (!isValidDate(year, mm, dd)) {
      return err(
        "INVALID_COMPONENT",
        "Asmens kodas contains an invalid date",
      );
    }
  }

  const check = twoPassCheck(v.slice(0, 10));
  if (check !== Number(v[10])) {
    return err(
      "INVALID_CHECKSUM",
      "Asmens kodas check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Lithuanian Personal Code. */
const asmens: Validator = {
  name: "Lithuanian Personal ID",
  localName: "Asmens kodas",
  abbreviation: "AK",
  country: "LT",
  entityType: "person",
  compact,
  format,
  validate,
};

export default asmens;
export { compact, format, validate };

/**
 * HETU (Henkilötunnus).
 *
 * Finnish personal identity code. 11 characters in
 * format DDMMYY+CCC+X where the separator indicates
 * the century and X is a check character.
 *
 * @see https://dvv.fi/en/personal-identity-code
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const CHECK_CHARS = "0123456789ABCDEFHJKLMNPRSTUVWXY";

const SEPARATORS_1800 = new Set(["+"]);
const SEPARATORS_1900 = new Set([
  "-",
  "Y",
  "X",
  "W",
  "V",
  "U",
]);
const SEPARATORS_2000 = new Set([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
]);

const compact = (value: string): string =>
  clean(value, " ").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "HETU must be exactly 11 characters",
    );
  }

  const dd = v.slice(0, 2);
  const mm = v.slice(2, 4);
  const yy = v.slice(4, 6);
  const separator = v[6];
  const serial = v.slice(7, 10);
  const checkChar = v[10];

  if (!isdigits(dd) || !isdigits(mm) || !isdigits(yy)) {
    return err(
      "INVALID_FORMAT",
      "HETU date part must be digits",
    );
  }
  if (!isdigits(serial)) {
    return err(
      "INVALID_FORMAT",
      "HETU serial must be digits",
    );
  }

  let century: number;
  if (SEPARATORS_1800.has(separator)) {
    century = 1800;
  } else if (SEPARATORS_1900.has(separator)) {
    century = 1900;
  } else if (SEPARATORS_2000.has(separator)) {
    century = 2000;
  } else {
    return err(
      "INVALID_COMPONENT",
      "HETU separator is invalid",
    );
  }

  const year = century + Number(yy);
  const month = Number(mm);
  const day = Number(dd);

  if (!isValidDate(year, month, day)) {
    return err(
      "INVALID_COMPONENT",
      "HETU contains an invalid date",
    );
  }

  const checkNum = Number(`${dd}${mm}${yy}${serial}`);
  const expected = CHECK_CHARS[checkNum % 31];
  if (checkChar !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "HETU check character does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Finnish Personal Identity Code. */
const hetu: Validator = {
  name: "Finnish Personal ID",
  localName: "Henkilötunnus",
  abbreviation: "HETU",
  country: "FI",
  entityType: "person",
  compact,
  format,
  validate,
};

export default hetu;
export { compact, format, validate };

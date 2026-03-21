/**
 * SVNR (Sozialversicherungsnummer).
 *
 * German social insurance number. 12 characters:
 * area number (2 digits) + date of birth (DDMMYY)
 * + initial letter of birth name (1 letter) +
 * serial number (2 digits) + check digit (1 digit).
 *
 * @see https://de.wikipedia.org/wiki/Sozialversicherungsnummer
 */

import { clean } from "#util/clean";
import {
  isValidDate,
  resolveTwoDigitYear,
} from "#util/date";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";
import { randomInt } from "#util/generate";

const letterValue = (ch: string): number => {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 64;
  return -1;
};

const WEIGHTS = [
  2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1,
] as const;

const compact = (value: string): string =>
  clean(value, " -/").toUpperCase();

const computeCheck = (v: string): number => {
  const digits: number[] = [];

  for (let i = 0; i < 8; i++) {
    digits.push(Number(v[i]));
  }

  const lv = letterValue(v[8]!);
  digits.push(Math.floor(lv / 10));
  digits.push(lv % 10);

  digits.push(Number(v[9]));
  digits.push(Number(v[10]));

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const product = digits[i]! * WEIGHTS[i]!;
    if (product >= 10) {
      sum +=
        Math.floor(product / 10) + (product % 10);
    } else {
      sum += product;
    }
  }

  return sum % 10;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "German SVNR must be 12 characters",
    );
  }

  if (!/^\d{8}[A-Z]\d{3}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "German SVNR must be 8 digits, 1 letter, " +
        "3 digits",
    );
  }

  const dd = Number(v.slice(2, 4));
  const mm = Number(v.slice(4, 6));
  const yy = Number(v.slice(6, 8));

  const year = resolveTwoDigitYear(yy);

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "German SVNR contains an invalid birth date",
    );
  }

  const expected = computeCheck(v);
  const actual = Number(v[11]);

  if (expected !== actual) {
    return err(
      "INVALID_CHECKSUM",
      "German SVNR check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return (
    `${v.slice(0, 2)} ${v.slice(2, 8)}` +
    ` ${v.slice(8, 9)} ${v.slice(9, 11)}` +
    ` ${v.slice(11)}`
  );
};

/** Generate a random valid German SVNR. */
const generate = (): string => {
  for (;;) {
    const area = String(randomInt(1, 99)).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const yy = String(randomInt(40, 99)).padStart(2, "0");
    const letter = String.fromCharCode(65 + randomInt(0, 25));
    const serial = String(randomInt(0, 49)).padStart(2, "0");
    const partial = area + dd + mm + yy + letter + serial;
    const c = partial + String(computeCheck(partial));
    if (validate(c).valid) return c;
  }
};

/** German Social Insurance Number. */
const svnr: Validator = {
  name: "German Social Insurance Number",
  localName: "Sozialversicherungsnummer",
  abbreviation: "SVNR",
  country: "DE",
  entityType: "person",
  description:
    "German social insurance number encoding " +
    "birth date and name initial",
  sourceUrl:
    "https://de.wikipedia.org/wiki/" +
    "Sozialversicherungsnummer",
  lengths: [12] as const,
  examples: ["12010188M011"] as const,
  compact,
  format,
  validate,
  generate,
};

export default svnr;
export { compact, format, validate, generate };

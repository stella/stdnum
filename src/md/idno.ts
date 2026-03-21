/**
 * IDNO (Moldavian company identification number).
 *
 * 13 digits: first digit identifies the registry,
 * next three are the assignment year, followed by
 * five identifier digits and a check digit.
 * Checksum uses weights [7, 3, 1] repeated.
 *
 * @see https://www.idno.md
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1] as const;

const calcCheckDigit = (number: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += (WEIGHTS[i] ?? 0) * Number(number[i]);
  }
  return sum % 10;
};

const compact = (value: string): string =>
  clean(value, " ");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Moldavian IDNO must contain only digits",
    );
  }
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "Moldavian IDNO must be 13 digits",
    );
  }
  const expected = calcCheckDigit(v);
  if (expected !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "Moldavian IDNO check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

const generate = (): string => {
  let digits = "";
  for (let i = 0; i < 12; i++) {
    digits += String(Math.floor(Math.random() * 10));
  }
  return digits + String(calcCheckDigit(digits));
};

/** Moldavian Company Identification Number. */
const idno: Validator = {
  name: "Moldavian Company Identification Number",
  localName: "IDNO",
  abbreviation: "IDNO",
  country: "MD",
  entityType: "company",
  lengths: [13] as const,
  sourceUrl: "https://www.idno.md/",
  examples: ["1008600038413"] as const,
  compact,
  format,
  validate,
  generate,
};

export default idno;
export { compact, format, validate };

/**
 * Isikukood (IK).
 *
 * Estonian personal identification code. 11 digits:
 * gender/century digit, YYMMDD, 3-digit serial, and
 * a check digit computed with two-pass weighted sums.
 *
 * @see https://www.riigiteataja.ee/en/eli/512012015003/consolide
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";
import { randomInt } from "#util/generate";

const WEIGHTS_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1] as const;
const WEIGHTS_2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3] as const;

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

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Compute the two-pass check digit used by both
 * Estonian IK and Lithuanian Asmens kodas.
 */
export const twoPassCheck = (digits: string): number => {
  let remainder = weightedSum(digits, WEIGHTS_1, 11);
  if (remainder !== 10) return remainder;
  remainder = weightedSum(digits, WEIGHTS_2, 11);
  return remainder === 10 ? 0 : remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Isikukood must be exactly 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Isikukood must contain only digits",
    );
  }

  const g = Number(v[0]);
  if (g < 1 || g > 8) {
    return err(
      "INVALID_COMPONENT",
      "Isikukood gender/century digit is invalid",
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
      "Isikukood contains an invalid date",
    );
  }

  const check = twoPassCheck(v.slice(0, 10));
  if (check !== Number(v[10])) {
    return err(
      "INVALID_CHECKSUM",
      "Isikukood check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from an Isikukood.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const g = Number(v[0]);
  const century = centuryMap[g] ?? 1900;
  const yy = Number(v.slice(1, 3));
  const mm = Number(v.slice(3, 5));
  const dd = Number(v.slice(5, 7));
  const year = century + yy;

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender: g % 2 === 1 ? "male" : "female",
  };
};

/** Generate a random valid Estonian IK. */
const generate = (): string => {
  for (;;) {
    const g = String(randomInt(3, 6));
    const yy = String(randomInt(0, 99)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const s = String(randomInt(0, 999)).padStart(3, "0");
    const payload = g + yy + mm + dd + s;
    const c = payload + String(twoPassCheck(payload));
    if (validate(c).valid) return c;
  }
};

/** Estonian Personal Identification Code. */
const ik: Validator = {
  name: "Estonian Personal ID",
  localName: "Isikukood",
  abbreviation: "IK",
  aliases: ["isikukood", "IK"] as const,
  candidatePattern: "[1-6]\\d{10}",
  country: "EE",
  entityType: "person",
  sourceUrl: 
    "https://www.riigiteataja.ee/en/eli/512012015003/consolide",
  examples: ["36805280109"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ik;
export { compact, format, parse, validate, generate };

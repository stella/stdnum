/**
 * South African Identity Number.
 *
 * 13-digit number encoding date of birth, gender,
 * citizenship, and a Luhn check digit.
 * Format: YYMMDD SSSS C A Z
 *   - YYMMDD: date of birth
 *   - SSSS: sequence (0000-4999 female, 5000-9999 male)
 *   - C: citizenship (0 = citizen, 1 = permanent resident)
 *   - A: was used for race (now always 8 or 9)
 *   - Z: Luhn check digit
 *
 * @see https://en.wikipedia.org/wiki/South_African_identity_document
 */

import {
  luhnValidate,
  luhnChecksum,
} from "#checksums/luhn";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " ");

/**
 * Resolve the birth date from the 2-digit year.
 * Years after the current year are assumed to be
 * in the previous century.
 */
const resolveBirthDate = (
  v: string,
): { year: number; month: number; day: number } | null => {
  const today = new Date();
  const century = Math.floor(today.getFullYear() / 100);
  let year = century * 100 + Number(v.slice(0, 2));
  const month = Number(v.slice(2, 4));
  const day = Number(v.slice(4, 6));
  if (year > today.getFullYear()) {
    year -= 100;
  }
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "SA ID must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "SA ID must contain only digits",
    );
  }
  if (resolveBirthDate(v) === null) {
    return err(
      "INVALID_COMPONENT",
      "SA ID contains an invalid date of birth",
    );
  }
  const citizenship = v[10];
  if (citizenship !== "0" && citizenship !== "1") {
    return err(
      "INVALID_COMPONENT",
      "SA ID citizenship digit must be 0 or 1",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "SA ID Luhn check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 13) {
    return `${v.slice(0, 6)} ${v.slice(6, 10)} ${v.slice(10, 12)} ${v.slice(12)}`;
  }
  return v;
};

/**
 * Extract birth date and gender from a South African
 * ID number. Returns null if the value is not valid.
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const bd = resolveBirthDate(v);
  if (bd === null) return null;

  const sequence = Number(v.slice(6, 10));

  return {
    birthDate: new Date(bd.year, bd.month - 1, bd.day),
    gender: sequence < 5000 ? "female" : "male",
  };
};

/** Generate a random valid South African ID. */
const generate = (): string => {
  for (;;) {
    const yy = String(randomInt(50, 99)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const serial = randomDigits(4);
    const citizen = String(randomInt(0, 1));
    const payload = yy + mm + dd + serial + citizen + "8";
    const cs = luhnChecksum(payload + "0");
    const c = payload + String((10 - cs) % 10);
    if (validate(c).valid) return c;
  }
};

/** South African Identity Number. */
const idnr: Validator<ParsedPersonId> = {
  name: "South African Identity Number",
  localName: "South African Identity Number",
  abbreviation: "SA ID",
  aliases: ["ID number", "RSA ID"] as const,
  candidatePattern: "\\d{13}",
  country: "ZA",
  entityType: "person",
  compact,
  format,
  parse,
  validate,
  description:
    "South African personal identification number",
  sourceUrl:
    "https://en.wikipedia.org/wiki/" +
    "South_African_identity_document",
  lengths: [13] as const,
  examples: ["7503305044089", "8001015009087"] as const,
  generate,
};

export default idnr;
export { compact, format, parse, validate, generate };

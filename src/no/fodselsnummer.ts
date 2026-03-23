/**
 * Fødselsnummer (Norwegian birth number).
 *
 * 11 digits: DDMMYY + 3-digit individual number + 2
 * check digits. Supports D-numbers (day + 40) and
 * H-numbers (month + 40).
 *
 * @see https://www.skatteetaten.no/
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";
import { randomDigits, randomInt } from "#util/generate";

const WEIGHTS_D1 = [3, 7, 6, 1, 8, 9, 4, 5, 2] as const;
const WEIGHTS_D2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

const compact = (value: string): string =>
  clean(value, " -");

const getCentury = (
  yy: number,
  individual: number,
): number | undefined => {
  if (individual >= 0 && individual <= 499) return 1900;
  if (individual >= 500 && individual <= 749 && yy >= 54) {
    return 1800;
  }
  if (individual >= 500 && individual <= 999 && yy < 40) {
    return 2000;
  }
  if (individual >= 900 && individual <= 999 && yy >= 40) {
    return 1900;
  }
  return undefined;
};

const checkDigit = (
  v: string,
  weights: readonly number[],
): number | undefined => {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(v.charAt(i)) * (weights[i] ?? 0);
  }
  const remainder = (11 - (sum % 11)) % 11;
  if (remainder === 10) return undefined;
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Norwegian birth number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Norwegian birth number must contain only digits",
    );
  }

  // Check digits
  const d1 = checkDigit(v, WEIGHTS_D1);
  if (d1 === undefined || d1 !== Number(v[9])) {
    return err(
      "INVALID_CHECKSUM",
      "Norwegian birth number check digit 1 mismatch",
    );
  }
  const d2 = checkDigit(v, WEIGHTS_D2);
  if (d2 === undefined || d2 !== Number(v[10])) {
    return err(
      "INVALID_CHECKSUM",
      "Norwegian birth number check digit 2 mismatch",
    );
  }

  // Parse date components
  let dd = Number(v.slice(0, 2));
  let mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));
  const individual = Number(v.slice(6, 9));

  // D-number: day > 40
  if (dd > 40) dd -= 40;
  // H-number: month > 40
  if (mm > 40) mm -= 40;

  const century = getCentury(yy, individual);
  if (century === undefined) {
    return err(
      "INVALID_COMPONENT",
      "Norwegian birth number has invalid individual/century combination",
    );
  }

  const year = century + yy;
  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "Norwegian birth number contains an invalid date",
    );
  }

  // Reject future birth dates
  if (new Date(year, mm - 1, dd) > new Date()) {
    return err(
      "INVALID_COMPONENT",
      "Birth date is in the future",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)} ${v.slice(6)}`;
};

/**
 * Extract birth date and gender from a Norwegian
 * birth number. Returns null if the value is not
 * valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  let dd = Number(v.slice(0, 2));
  let mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));
  const individual = Number(v.slice(6, 9));

  if (dd > 40) dd -= 40;
  if (mm > 40) mm -= 40;

  const century = getCentury(yy, individual);
  if (century === undefined) return null;

  const year = century + yy;

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender: individual % 2 === 0 ? "female" : "male",
  };
};

/** Generate a random valid Norwegian birth number. */
const generate = (): string => {
  for (;;) {
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const yy = String(randomInt(50, 99)).padStart(2, "0");
    const ind = String(randomInt(0, 499)).padStart(3, "0");
    const c = dd + mm + yy + ind + randomDigits(2);
    if (validate(c).valid) return c;
  }
};

/** Norwegian Birth Number. */
const fodselsnummer: Validator = {
  name: "Norwegian Birth Number",
  localName: "Fødselsnummer",
  abbreviation: "Fødselsnr",
  aliases: [
    "fødselsnummer",
    "personnummer",
  ] as const,
  candidatePattern: "\\d{11}",
  country: "NO",
  entityType: "person",
  sourceUrl: "https://www.skatteetaten.no/",
  examples: ["15108695088"] as const,
  compact,
  format,
  validate,
  generate,
};

export default fodselsnummer;
export { compact, format, parse, validate, generate };

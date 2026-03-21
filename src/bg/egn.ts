/**
 * EGN (Единен граждански номер).
 *
 * Bulgarian personal identification number.
 * 10 digits encoding date of birth, serial number,
 * and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/Unique_citizenship_number
 * @see https://www.grao.bg/
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

const WEIGHTS = [2, 4, 8, 5, 10, 9, 7, 3, 6] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "EGN must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "EGN must contain only digits",
    );
  }

  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));

  let year: number;
  let month: number;
  if (mm > 40) {
    year = 2000 + yy;
    month = mm - 40;
  } else if (mm > 20) {
    year = 1800 + yy;
    month = mm - 20;
  } else {
    year = 1900 + yy;
    month = mm;
  }

  if (!isValidDate(year, month, dd)) {
    return err(
      "INVALID_COMPONENT",
      "EGN contains an invalid date",
    );
  }

  const sum = weightedSum(v.slice(0, 9), WEIGHTS, 11);
  const check = sum % 10;
  if (check !== Number(v[9])) {
    return err(
      "INVALID_CHECKSUM",
      "EGN check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from an EGN.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const serial = Number(v.slice(6, 9));

  let year: number;
  let month: number;
  if (mm > 40) {
    year = 2000 + yy;
    month = mm - 40;
  } else if (mm > 20) {
    year = 1800 + yy;
    month = mm - 20;
  } else {
    year = 1900 + yy;
    month = mm;
  }

  return {
    birthDate: new Date(year, month - 1, dd),
    gender: serial % 2 === 0 ? "male" : "female",
  };
};

/** Generate a random valid EGN. */
const generate = (): string => {
  for (;;) {
    const yy = String(randomInt(0, 99)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const serial = String(randomInt(0, 999)).padStart(3, "0");
    const payload = yy + mm + dd + serial;
    const sum = weightedSum(payload, WEIGHTS, 11);
    const c = payload + String(sum % 10);
    if (validate(c).valid) return c;
  }
};

/** Bulgarian Personal Identification Number. */
const egn: Validator = {
  name: "Bulgarian Personal ID",
  localName: "Единен граждански номер",
  abbreviation: "ЕГН",
  aliases: [
    "ЕГН",
    "единен граждански номер",
    "EGN",
  ] as const,
  candidatePattern: "\\d{10}",
  country: "BG",
  entityType: "person",
  sourceUrl: "https://www.grao.bg/",
  examples: ["7523169263"] as const,
  compact,
  format,
  validate,
  generate,
};

export default egn;
export { compact, format, parse, validate, generate };

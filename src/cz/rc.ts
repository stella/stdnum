/**
 * RČ (Rodné číslo).
 *
 * Czech and Slovak national identifier (birth
 * number). 9 or 10 digits encoding date of birth
 * and gender. 10-digit numbers (post-1954) must
 * be divisible by 11.
 *
 * Women have 50 added to the month. Since 2004,
 * an extra +20 offset is used when the serial
 * range is exhausted.
 *
 * @see https://www.mvcr.cz/mvcren/docDetail.aspx?docid=21975362&doctype=ART
 * @see Law 133/2000 Sb.
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomInt } from "#util/generate";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " /");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Birth number must be 9 or 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Birth number must contain only digits",
    );
  }

  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));

  // Strip gender (+50) and overflow (+20) offsets
  const month = (mm % 50) % 20 || mm % 50;
  if (month < 1 || month > 12) {
    return err(
      "INVALID_COMPONENT",
      "Birth number contains an invalid month",
    );
  }

  if (dd < 1 || dd > 31) {
    return err(
      "INVALID_COMPONENT",
      "Birth number contains an invalid day",
    );
  }

  // Resolve full year
  let year = yy + 1900;
  if (v.length === 9) {
    // 9-digit: pre-1954 only
    if (year >= 1980) year -= 100;
    if (year > 1953) {
      return err(
        "INVALID_COMPONENT",
        "9-digit birth numbers are pre-1954 only",
      );
    }
  } else {
    // 10-digit: if year < 1954, it's 2000s
    if (year < 1954) year += 100;
  }

  // Validate the actual date
  if (!isValidDate(year, month, dd)) {
    return err(
      "INVALID_COMPONENT",
      "Birth number contains an invalid date",
    );
  }

  // 10-digit: check digit is first 9 digits
  // mod 11 mod 10
  if (v.length === 10) {
    const front = Number(v.slice(0, 9));
    const check = (front % 11) % 10;
    if (String(check) !== v[9]) {
      return err(
        "INVALID_CHECKSUM",
        "Birth number is not divisible by 11",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)}/${v.slice(6)}`;
};

/**
 * Extract birth date and gender from a birth number.
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

  const gender = mm > 50 ? "female" : "male";
  const month = (mm % 50) % 20 || mm % 50;

  let year = yy + 1900;
  if (v.length === 10 && year < 1954) year += 100;
  if (v.length === 9 && year >= 1980) year -= 100;

  return {
    birthDate: new Date(year, month - 1, dd),
    gender,
  };
};


/**
 * Generate a random valid 10-digit birth number.
 * Uses a random date between 1954 and 2024.
 */
const generate = (): string => {
  const year = randomInt(1954, 2024);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  const isFemale = Math.random() < 0.5;
  const mm = isFemale ? month + 50 : month;

  const yy = String(year % 100).padStart(2, "0");
  const mmStr = String(mm).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  const datePart = `${yy}${mmStr}${dd}`;
  for (let seq = 0; seq < 1000; seq++) {
    const seqStr = String(seq).padStart(3, "0");
    const front = `${datePart}${seqStr}`;
    const num = Number(front);
    const check = (num % 11) % 10;
    const result = `${front}${String(check)}`;
    if (validate(result).valid) {
      return result;
    }
  }

  return "7103192745";
};

/** Czech/Slovak Birth Number. */
const rc: Validator = {
  name: "Czech Birth Number",
  localName: "Rodné číslo",
  abbreviation: "RČ",
  country: "CZ",
  entityType: "person",
  description:
    "Czech/Slovak national identifier encoding birth date and gender",
  sourceUrl:
    "https://www.mvcr.cz/mvcren/docDetail.aspx?docid=21975362&doctype=ART",
  lengths: [9, 10] as const,
  examples: ["7103192745"] as const,
  compact,
  format,
  validate,
  generate,
};

export default rc;
export { compact, format, generate, parse, validate };

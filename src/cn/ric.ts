/**
 * RIC (Resident Identity Card number, 居民身份证号码).
 *
 * Chinese national identifier. 18 characters:
 * 6 (area code) + 8 (YYYYMMDD birth) + 3 (sequence,
 * odd = male) + 1 (check, 0-9 or X).
 *
 * Also accepts the legacy 15-digit format (no check
 * digit, 2-digit year).
 *
 * @see https://en.wikipedia.org/wiki/Resident_Identity_Card
 */

import {
  mod112checkChar,
  mod112validate,
} from "#checksums/mod112";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 15 && v.length !== 18) {
    return err(
      "INVALID_LENGTH",
      "RIC must be 15 or 18 characters",
    );
  }

  if (v.length === 15) {
    if (!isdigits(v)) {
      return err(
        "INVALID_FORMAT",
        "15-digit RIC must contain only digits",
      );
    }
    // Validate date: digits 6-11 are YYMMDD
    const year = 1900 + Number(v.slice(6, 8));
    const month = Number(v.slice(8, 10));
    const day = Number(v.slice(10, 12));
    if (!isValidDate(year, month, day)) {
      return err(
        "INVALID_COMPONENT",
        "RIC contains an invalid birth date",
      );
    }
    return { valid: true, compact: v };
  }

  // 18-character format
  if (!isdigits(v.slice(0, 17))) {
    return err(
      "INVALID_FORMAT",
      "RIC must contain only digits (plus check char)",
    );
  }
  const lastChar = v[17]!;
  if (!isdigits(lastChar) && lastChar !== "X") {
    return err(
      "INVALID_FORMAT",
      "RIC check character must be 0-9 or X",
    );
  }

  // Validate date: digits 6-13 are YYYYMMDD
  const year = Number(v.slice(6, 10));
  const month = Number(v.slice(10, 12));
  const day = Number(v.slice(12, 14));
  if (!isValidDate(year, month, day)) {
    return err(
      "INVALID_COMPONENT",
      "RIC contains an invalid birth date",
    );
  }

  if (!mod112validate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "RIC check character does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from an RIC number.
 * Returns null if the value is not valid.
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;

  let year: number;
  let month: number;
  let day: number;
  let seq: number;

  if (v.length === 15) {
    year = 1900 + Number(v.slice(6, 8));
    month = Number(v.slice(8, 10));
    day = Number(v.slice(10, 12));
    seq = Number(v.slice(12, 15));
  } else {
    year = Number(v.slice(6, 10));
    month = Number(v.slice(10, 12));
    day = Number(v.slice(12, 14));
    seq = Number(v.slice(14, 17));
  }

  const gender = seq % 2 === 1 ? "male" : "female";

  return {
    birthDate: new Date(year, month - 1, day),
    gender,
  };
};

/** Generate a random valid 18-digit RIC. */
const generate = (): string => {
  // Use a simple area code prefix
  const area = String(randomInt(110000, 659999));
  const year = randomInt(1950, 2005);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  const seqNum = randomInt(1, 999);
  const seq = String(seqNum).padStart(3, "0");

  const yStr = String(year);
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");

  const payload = `${area}${yStr}${mStr}${dStr}${seq}`;
  const check = mod112checkChar(payload);
  return `${payload}${check}`;
};

/** Chinese Resident Identity Card number. */
const ric: Validator = {
  name: "Chinese Resident Identity Card",
  localName: "居民身份证号码",
  abbreviation: "RIC",
  aliases: ["身份证", "居民身份证号码", "RIC"] as const,
  candidatePattern: "\\d{17}[\\dX]",
  country: "CN",
  entityType: "person",
  description:
    "18-character national ID encoding area, birth date, gender, and check digit",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Resident_Identity_Card",
  lengths: [15, 18] as const,
  examples: [
    "11010519491231002X",
    "440524188001010014",
  ] as const,
  compact,
  format,
  validate,
  generate,
};

export default ric;
export { compact, format, generate, parse, validate };

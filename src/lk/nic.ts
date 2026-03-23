/**
 * NIC (National Identity Card, ජාතික හැඳුනුම්පත).
 *
 * Sri Lankan personal identity number. Two formats:
 *   Old (pre-2016): 9 digits + V or X (10 chars)
 *   New (2016+):    12 digits
 *
 * Both encode birth date (day-of-year), gender, a
 * serial number, and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/National_identification_number#Sri_Lanka
 * @see https://drp.gov.lk/Templates/Artical%20-%20English%20new%20number.html
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

/** Old format: 9 digits + V or X (case-insensitive). */
const OLD_RE = /^\d{9}[VvXx]$/;

/** New format: exactly 12 digits. */
const NEW_RE = /^\d{12}$/;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

/**
 * Convert an old-format NIC to the 12-digit new
 * format for uniform validation.
 *
 * Old: YY DDD SSS C V/X  (10 chars)
 * New: 19YY DDD 0SSS C   (12 digits)
 */
const toNewFormat = (v: string): string => {
  const yy = v.slice(0, 2);
  const ddd = v.slice(2, 5);
  const sss = v.slice(5, 8);
  const check = v[8];
  return `19${yy}${ddd}0${sss}${check}`;
};

/**
 * Checksum weights for the first 11 digits.
 * Algorithm: weighted sum mod 11, then mod 10
 * if >= 10.
 */
const CHECK_WEIGHTS = [
  8, 4, 3, 2, 7, 6, 5, 7, 4, 3, 2,
] as const;

const checkDigit = (digits: string): number => {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += (CHECK_WEIGHTS[i] ?? 0) * Number(digits.charAt(i));
  }
  const d = 11 - (sum % 11);
  return d > 9 ? d % 10 : d;
};

/**
 * Resolve birth date and gender from the 12-digit
 * normalised form (YYYY DDD ...).
 *
 * Day-of-year encoding:
 *   Male:   1–366
 *   Female: 501–866 (subtract 500)
 */
const resolveBirthInfo = (
  v: string,
): {
  year: number;
  month: number;
  day: number;
  gender: "male" | "female";
} | null => {
  const year = Number(v.slice(0, 4));
  let days = Number(v.slice(4, 7));

  const gender: "male" | "female" =
    days > 500 ? "female" : "male";
  if (days > 500) days -= 500;

  if (days < 1 || days > 366) return null;

  // Convert day-of-year to month/day via Date
  const d = new Date(year, 0, days);
  const month = d.getMonth() + 1;
  const dayOfMonth = d.getDate();

  if (!isValidDate(year, month, dayOfMonth)) {
    return null;
  }

  // Guard against day 366 in non-leap years
  if (d.getFullYear() !== year) return null;

  return { year, month, day: dayOfMonth, gender };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  const isOld = OLD_RE.test(v);
  const isNew = NEW_RE.test(v);

  if (!isOld && !isNew) {
    if (v.length !== 10 && v.length !== 12) {
      return err(
        "INVALID_LENGTH",
        "NIC must be 10 (old) or 12 (new) characters",
      );
    }
    return err(
      "INVALID_FORMAT",
      "NIC must be 9 digits + V/X (old) or" +
        " 12 digits (new)",
    );
  }

  const normalized = isOld ? toNewFormat(v) : v;

  if (!isdigits(normalized)) {
    return err(
      "INVALID_FORMAT",
      "NIC contains invalid characters",
    );
  }

  if (resolveBirthInfo(normalized) === null) {
    return err(
      "INVALID_COMPONENT",
      "NIC contains an invalid date of birth",
    );
  }

  const expected = checkDigit(normalized.slice(0, 11));
  if (expected !== Number(normalized[11])) {
    return err(
      "INVALID_CHECKSUM",
      "NIC check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  // Old format: YYDDDSSSXV → no standard separator
  // New format: YYYYDDDSSSSC → no standard separator
  return v;
};

/**
 * Extract birth date and gender from an NIC.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const isOld = OLD_RE.test(v);
  const normalized = isOld ? toNewFormat(v) : v;

  const info = resolveBirthInfo(normalized);
  if (info === null) return null;

  return {
    birthDate: new Date(
      info.year, info.month - 1, info.day,
    ),
    gender: info.gender,
  };
};

/** Sri Lankan National Identity Card. */
const nic: Validator = {
  name: "National Identity Card",
  localName: "ජාතික හැඳුනුම්පත",
  abbreviation: "NIC",
  aliases: ["NIC", "ජාතික හැඳුනුම්පත"] as const,
  candidatePattern: "\\d{9}[VXvx]|\\d{12}",
  country: "LK",
  entityType: "person",
  description:
    "Sri Lankan personal identity number issued to" +
    " all citizens",
  sourceUrl:
    "https://en.wikipedia.org/wiki/" +
    "National_identification_number#Sri_Lanka",
  lengths: [10, 12] as const,
  examples: [
    "197819202757",
    "862348753V",
  ] as const,
  compact,
  format,
  validate,
};

export default nic;
export { compact, format, parse, validate };

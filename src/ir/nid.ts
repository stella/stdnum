/**
 * NID (Iranian National ID, کد ملی, Code Melli).
 *
 * 10-digit personal identification number assigned to
 * every Iranian citizen. Digits 1-3 encode the province,
 * digits 4-9 are a sequential identifier, and digit 10
 * is a check digit.
 *
 * Check digit algorithm (mod 11):
 *   sum = Σ(digit[i] × (10 − i)) for i = 0..8
 *   r   = sum mod 11
 *   if r < 2: check digit = r
 *   if r ≥ 2: check digit = 11 − r
 *
 * Numbers where all digits are identical (e.g.
 * 0000000000, 1111111111) are rejected.
 *
 * Accepts both Persian (Extended Arabic-Indic, U+06Fx)
 * and Arabic-Indic (U+066x) digits.
 *
 * @see https://www.sabteahval.ir/
 * @see https://persian-tools.js.org/functions/verifyIranianNationalId.html
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

/**
 * Arabic-Indic and Extended Arabic-Indic digit map.
 * Converts Arabic/Persian numeral characters to ASCII.
 */
const ARABIC_DIGITS: Record<string, string> = {
  "\u0660": "0", // ٠
  "\u0661": "1", // ١
  "\u0662": "2", // ٢
  "\u0663": "3", // ٣
  "\u0664": "4", // ٤
  "\u0665": "5", // ٥
  "\u0666": "6", // ٦
  "\u0667": "7", // ٧
  "\u0668": "8", // ٨
  "\u0669": "9", // ٩
  "\u06F0": "0", // ۰
  "\u06F1": "1", // ۱
  "\u06F2": "2", // ۲
  "\u06F3": "3", // ۳
  "\u06F4": "4", // ۴
  "\u06F5": "5", // ۵
  "\u06F6": "6", // ۶
  "\u06F7": "7", // ۷
  "\u06F8": "8", // ۸
  "\u06F9": "9", // ۹
};

const ARABIC_REGEX = new RegExp(
  `[${Object.keys(ARABIC_DIGITS).join("")}]`,
  "g",
);

/** All-same-digit patterns (0000000000 .. 9999999999). */
const ALL_SAME = new Set(
  Array.from({ length: 10 }, (_, i) =>
    String(i).repeat(10),
  ),
);

const compact = (value: string): string => {
  const cleaned = clean(value, " -./");
  return cleaned.replace(
    ARABIC_REGEX,
    (ch) => ARABIC_DIGITS[ch] ?? ch,
  );
};

/**
 * Calculate the check digit from the first 9 digits.
 */
const calcCheckDigit = (number: string): number => {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(number[i]) * (10 - i);
  }
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Iranian NID must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Iranian NID must contain only digits",
    );
  }
  if (ALL_SAME.has(v)) {
    return err(
      "INVALID_FORMAT",
      "Iranian NID must not have all identical digits",
    );
  }
  if (calcCheckDigit(v) !== Number(v[9])) {
    return err(
      "INVALID_CHECKSUM",
      "Iranian NID check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

/** Iranian NIDs are displayed without separators. */
const format = (value: string): string => compact(value);

/**
 * Generate a random valid Iranian NID.
 * NOT cryptographically secure.
 */
const generate = (): string => {
  const base = randomDigits(9);
  const check = calcCheckDigit(base);
  const result = `${base}${check}`;
  if (ALL_SAME.has(result)) return generate();
  return result;
};

/** Iranian National Identification Number. */
const nid: Validator = {
  name: "Iranian National ID",
  localName: "کد ملی",
  abbreviation: "NID",
  aliases: [
    "NID",
    "کد ملی",
    "Iranian National ID",
  ] as const,
  candidatePattern: "\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}",
  country: "IR",
  entityType: "person",
  sourceUrl: "https://www.sabteahval.ir/",
  description:
    "Iranian personal identification number (Code Melli)",
  lengths: [10] as const,
  examples: ["0932833810"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nid;
export { compact, format, validate, generate };

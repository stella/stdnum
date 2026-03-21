/**
 * TN (Tax Registration Number, الرقم الضريبي).
 *
 * Egyptian tax number. 9 digits, no checksum.
 * Displayed as XXX-XXX-XXX. Accepts both
 * Arabic-Indic and Extended Arabic-Indic digits.
 *
 * @see https://www.eta.gov.eg/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Arabic-Indic and Extended Arabic-Indic digit map.
 * Converts Arabic numeral characters to ASCII digits.
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

const compact = (value: string): string => {
  const cleaned = clean(value, " -/");
  return cleaned.replace(
    ARABIC_REGEX,
    (ch) => ARABIC_DIGITS[ch] ?? ch,
  );
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Egyptian TN must be exactly 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Egyptian TN must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6)}`;
};

/** Egyptian Tax Registration Number. */
const tn: Validator = {
  name: "Egyptian Tax Registration Number",
  localName: "الرقم الضريبي",
  abbreviation: "TN",
  country: "EG",
  entityType: "any",
  compact,
  format,
  validate,
  description: "Egyptian tax identification number",
  sourceUrl: "https://www.eta.gov.eg/",
  lengths: [9] as const,
  examples: ["100531385", "331105268"] as const,
};

export default tn;
export { compact, format, validate };

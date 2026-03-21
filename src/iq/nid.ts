/**
 * NID (Iraqi National ID, البطاقة الوطنية الموحدة).
 *
 * 12-digit personal identification number on the
 * Iraqi National Card (Unified National Card), issued
 * by the Ministry of Interior since 2016.
 *
 * No public checksum algorithm is documented.
 * Validation is limited to format: exactly 12 decimal
 * digits. Accepts both Arabic-Indic (U+066x) and
 * Extended Arabic-Indic (U+06Fx) digits.
 *
 * @see https://mofa.gov.iq/the-civil-status-id/
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
  const cleaned = clean(value, " -./");
  return cleaned.replace(
    ARABIC_REGEX,
    (ch) => ARABIC_DIGITS[ch] ?? ch,
  );
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Iraqi NID must be exactly 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Iraqi NID must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

/** Iraqi NIDs are displayed without separators. */
const format = (value: string): string => compact(value);

/** Iraqi National Identification Number. */
const nid: Validator = {
  name: "Iraqi National ID",
  localName: "البطاقة الوطنية الموحدة",
  abbreviation: "NID",
  aliases: [
    "NID",
    "البطاقة الوطنية الموحدة",
    "Iraqi National ID",
  ] as const,
  candidatePattern: "\\d{12}",
  country: "IQ",
  entityType: "person",
  sourceUrl: "https://mofa.gov.iq/the-civil-status-id/",
  description:
    "Iraqi personal identification number (National Card)",
  lengths: [12] as const,
  examples: ["012345678901"] as const,
  compact,
  format,
  validate,
};

export default nid;
export { compact, format, validate };

/**
 * Shared Arabic-Indic and Extended Arabic-Indic digit
 * normalization utilities.
 *
 * Arabic-Indic (U+0660..U+0669) and Extended Arabic-Indic
 * (U+06F0..U+06F9, used for Persian/Dari) digits are
 * mapped to ASCII 0-9.
 */

export const ARABIC_DIGITS: Record<string, string> = {
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

export const ARABIC_REGEX = new RegExp(
  `[${Object.keys(ARABIC_DIGITS).join("")}]`,
  "g",
);

/**
 * Replace Arabic-Indic and Extended Arabic-Indic digits
 * with their ASCII equivalents.
 */
export const normalizeArabicDigits = (
  value: string,
): string =>
  value.replace(
    ARABIC_REGEX,
    (ch) => ARABIC_DIGITS[ch] ?? ch,
  );

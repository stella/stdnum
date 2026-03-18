/** Check if the string contains only digits. */
export const isdigits = (value: string): boolean =>
  value.length > 0 && /^\d+$/.test(value);

/**
 * Check if the string contains only ASCII
 * letters (a-z, A-Z).
 */
export const isalpha = (value: string): boolean =>
  value.length > 0 && /^[a-zA-Z]+$/.test(value);

/**
 * Check if the string contains only ASCII
 * letters and digits.
 */
export const isalnum = (value: string): boolean =>
  value.length > 0 && /^[a-zA-Z0-9]+$/.test(value);

/**
 * Convert a single character to its numeric
 * value (0-9 for digits, 10-35 for A-Z).
 */
export const charValue = (ch: string): number => {
  const code = ch.charCodeAt(0);
  // 0-9
  if (code >= 48 && code <= 57) return code - 48;
  // A-Z
  if (code >= 65 && code <= 90) return code - 55;
  // a-z
  if (code >= 97 && code <= 122) return code - 87;
  return 0;
};

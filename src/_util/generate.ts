/**
 * Helpers for generating random valid identifiers.
 * NOT cryptographically secure; use only for
 * testing, demos, and form placeholders.
 */

/** Generate a string of n random decimal digits. */
export const randomDigits = (n: number): string => {
  let result = "";
  for (let i = 0; i < n; i++) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
};

/**
 * Generate a random integer in [min, max]
 * (inclusive).
 */
export const randomInt = (
  min: number,
  max: number,
): number =>
  min + Math.floor(Math.random() * (max - min + 1));

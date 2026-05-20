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

/**
 * Pick a random element from a non-empty array.
 * Throws if the array is empty so generators that
 * declare a fixed pool fail loudly instead of
 * returning `undefined`.
 */
export const randomPick = <T>(values: readonly T[]): T => {
  if (values.length === 0) {
    throw new Error("randomPick called with empty array");
  }
  const idx = randomInt(0, values.length - 1);
  // SAFETY: idx is bounded by values.length and the
  // array is non-empty (checked above).
  const value = values[idx];
  if (value === undefined) {
    throw new Error("randomPick produced undefined");
  }
  return value;
};

/**
 * Pick a random character from a non-empty string.
 * Same contract as `randomPick` for arrays.
 */
export const randomChar = (chars: string): string => {
  if (chars.length === 0) {
    throw new Error("randomChar called with empty string");
  }
  const idx = randomInt(0, chars.length - 1);
  // SAFETY: idx is bounded by chars.length and the
  // string is non-empty (checked above).
  const ch = chars[idx];
  if (ch === undefined) {
    throw new Error("randomChar produced undefined");
  }
  return ch;
};

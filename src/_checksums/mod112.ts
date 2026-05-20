/**
 * ISO 7064 Mod 11,2 check character algorithm.
 * Used by CN RIC (Resident Identity Card).
 *
 * Weights are powers of 2 modulo 11
 * (2^17 mod 11 ... 2^1 mod 11), applied
 * left-to-right across the 17-character payload.
 * The check character is looked up from
 * "10X98765432".
 */

const WEIGHTS = [
  7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2,
] as const;

const CHECK_CHARS = "10X98765432";

/**
 * Compute the ISO 7064 Mod 11,2 check character
 * for a 17-character payload.
 */
export const mod112checkChar = (
  payload: string,
): string => {
  let sum = 0;
  for (const [i, weight] of WEIGHTS.entries()) {
    sum += Number(payload[i]) * weight;
  }
  // SAFETY: sum % 11 is in 0..10 and CHECK_CHARS has 11 chars.
  return CHECK_CHARS[sum % 11] ?? "";
};

/**
 * Validate an 18-character string with a Mod 11,2
 * check character (last char is 0-9 or X).
 */
export const mod112validate = (value: string): boolean => {
  const check = value[17]?.toUpperCase();
  if (check === undefined) return false;
  return mod112checkChar(value.slice(0, 17)) === check;
};

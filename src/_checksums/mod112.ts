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
  7, 9, 10, 5, 8, 4, 2, 1, 6,
  3, 7, 9, 10, 5, 8, 4, 2,
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
  for (let i = 0; i < 17; i++) {
    sum += Number(payload[i]) * WEIGHTS[i]!;
  }
  return CHECK_CHARS[sum % 11]!;
};

/**
 * Validate an 18-character string with a Mod 11,2
 * check character (last char is 0-9 or X).
 */
export const mod112validate = (
  value: string,
): boolean => {
  const payload = value.slice(0, 17);
  const check = value[17]!.toUpperCase();
  return mod112checkChar(payload) === check;
};

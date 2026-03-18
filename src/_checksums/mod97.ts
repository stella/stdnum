/**
 * ISO 7064 Mod 97-10 checksum.
 * Used by IBAN and LEI.
 *
 * Processes one digit at a time to avoid BigInt.
 */

/**
 * Compute mod 97 of a numeric string.
 * Letters must already be converted to digits.
 */
export const mod97 = (value: string): number => {
  let remainder = 0;
  for (let i = 0; i < value.length; i++) {
    remainder = (remainder * 10 + Number(value[i])) % 97;
  }
  return remainder;
};

/**
 * Validate a string using ISO 7064 Mod 97-10.
 * The remainder must equal 1.
 *
 * @param value - Numeric string (letters already
 *   converted via charValue)
 */
export const mod97validate = (value: string): boolean =>
  mod97(value) === 1;

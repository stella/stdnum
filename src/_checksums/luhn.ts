/**
 * Luhn checksum algorithm (ISO/IEC 7812-1).
 * Used by credit cards, IMEI, Canadian SIN, etc.
 */

/** Compute the Luhn checksum of a digit string. */
export const luhnChecksum = (value: string): number => {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let d = Number(value[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10;
};

/** Validate a digit string using Luhn. */
export const luhnValidate = (value: string): boolean =>
  luhnChecksum(value) === 0;

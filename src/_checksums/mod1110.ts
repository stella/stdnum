/**
 * ISO 7064 Mod 11,10 check digit algorithm.
 * Used by DE VAT, DE IdNr, HR OIB.
 */

/** Compute the Mod 11,10 check digit for a payload. */
export const mod1110checkDigit = (
  payload: string,
): number => {
  let product = 10;
  for (let i = 0; i < payload.length; i++) {
    let sum = (Number(payload[i]) + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  return (11 - product) % 10;
};

/** Validate a string with a Mod 11,10 check digit. */
export const mod1110validate = (value: string): boolean => {
  const payload = value.slice(0, -1);
  const check = Number(value[value.length - 1]);
  return mod1110checkDigit(payload) === check;
};

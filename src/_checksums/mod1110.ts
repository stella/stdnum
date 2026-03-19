/**
 * ISO 7064 Mod 11,10 check digit algorithm.
 * Used by DE VAT, DE IdNr, HR OIB.
 */
export const mod1110validate = (value: string): boolean => {
  let product = 10;
  for (let i = 0; i < value.length - 1; i++) {
    let sum = (Number(value[i]) + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = (11 - product) % 10;
  return check === Number(value[value.length - 1]);
};

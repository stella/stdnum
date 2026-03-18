/**
 * Compute a weighted sum of digits.
 *
 * @param value - String of digits
 * @param weights - Array of weights (cycled if
 *   shorter than value)
 * @param modulus - Modulus for the result
 */
export const weightedSum = (
  value: string,
  weights: readonly number[],
  modulus: number,
): number => {
  let sum = 0;
  for (let i = 0; i < value.length; i++) {
    const digit = Number(value[i]);
    // SAFETY: modulo guarantees valid index
    // eslint-disable-next-line no-non-null-assertion
    const weight = weights[i % weights.length]!;
    sum += digit * weight;
  }
  return ((sum % modulus) + modulus) % modulus;
};

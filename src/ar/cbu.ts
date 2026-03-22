/**
 * CBU (Clave Bancaria Uniforme).
 *
 * Argentine bank account number used for electronic
 * transfers. 22 digits: 3-digit bank + 4-digit branch
 * + 1 check digit + 13-digit account + 1 check digit.
 *
 * @see https://es.wikipedia.org/wiki/Clave_bancaria_uniforme
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS_BLOCK1 = [7, 1, 3, 9, 7, 1, 3];
const WEIGHTS_BLOCK2 = [
  3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3,
];

const compact = (value: string): string =>
  clean(value, " -").trim();

const calcCheck = (
  digits: string,
  weights: readonly number[],
): number => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * weights[i]!;
  }
  return (10 - (sum % 10)) % 10;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 22) {
    return err(
      "INVALID_LENGTH",
      "CBU must be 22 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CBU must contain only digits",
    );
  }

  // First block: digits 0-6, check digit at 7
  const check1 = calcCheck(
    v.slice(0, 7),
    WEIGHTS_BLOCK1,
  );
  if (check1 !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "CBU first check digit mismatch",
    );
  }

  // Second block: digits 8-20, check digit at 21
  const check2 = calcCheck(
    v.slice(8, 21),
    WEIGHTS_BLOCK2,
  );
  if (check2 !== Number(v[21])) {
    return err(
      "INVALID_CHECKSUM",
      "CBU second check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 8)} ${v.slice(8)}`;
};

/** Argentine Uniform Bank Key. */
const cbu: Validator = {
  name: "Argentine Bank Account Number",
  localName: "Clave Bancaria Uniforme",
  abbreviation: "CBU",
  aliases: [
    "CBU",
    "Clave Bancaria Uniforme",
  ] as const,
  candidatePattern: "\\d{22}",
  country: "AR",
  entityType: "any",
  sourceUrl:
    "https://es.wikipedia.org/wiki/Clave_bancaria_uniforme",
  lengths: [22] as const,
  examples: ["2850590940090418135201"] as const,
  compact,
  format,
  validate,
};

export default cbu;
export { compact, format, validate };

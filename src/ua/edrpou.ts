/**
 * EDRPOU (ЄДРПОУ, Unified State Register of
 * Enterprises and Organizations of Ukraine).
 *
 * 8-digit company identification number with a
 * weighted checksum. Two sets of weights are used
 * depending on whether the first digit is 0-2/6-9 or 3-5.
 *
 * @see https://en.wikipedia.org/wiki/EDRPOU
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS_A = [1, 2, 3, 4, 5, 6, 7] as const;
const WEIGHTS_B = [7, 1, 2, 3, 4, 5, 6] as const;
const WEIGHTS_A2 = [3, 4, 5, 6, 7, 8, 9] as const;
const WEIGHTS_B2 = [9, 3, 4, 5, 6, 7, 8] as const;

const calcCheck = (
  value: string,
  weights: readonly number[],
): number => {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(value[i]) * weights[i]!;
  }
  return sum % 11;
};

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "EDRPOU must be exactly 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "EDRPOU must contain only digits",
    );
  }

  const firstDigit = Number(v[0]);
  const useA =
    firstDigit < 3 || firstDigit >= 6;
  const weightsFirst =
    useA ? WEIGHTS_A : WEIGHTS_B;
  const weightsSecond =
    useA ? WEIGHTS_A2 : WEIGHTS_B2;

  let check = calcCheck(v, weightsFirst);
  if (check >= 10) {
    check = calcCheck(v, weightsSecond) % 10;
  }

  if (check !== Number(v[7])) {
    return err(
      "INVALID_CHECKSUM",
      "EDRPOU check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Ukrainian Company Register Number. */
const edrpou: Validator = {
  name: "Ukrainian Company Register Number",
  localName: "ЄДРПОУ",
  abbreviation: "ЄДРПОУ",
  country: "UA",
  entityType: "company",
  lengths: [8] as const,
  examples: ["14360570"] as const,
  compact,
  format,
  validate,
};

export default edrpou;
export { compact, format, validate };

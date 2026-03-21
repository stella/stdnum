/**
 * USCC (Unified Social Credit Code, 统一社会信用代码).
 *
 * 18 alphanumeric characters (excluding I, O, Z, S, V):
 * 1 (registering authority) + 1 (entity type) +
 * 6 (region code, digits only) + 9 (organisation code) +
 * 1 (mod 31 check character).
 *
 * @see https://zh.wikipedia.org/wiki/统一社会信用代码
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const ALPHABET = "0123456789ABCDEFGHJKLMNPQRTUWXY";

const WEIGHTS = [
  1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10,
  30, 28,
] as const;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const calcCheckChar = (value: string): string => {
  let total = 0;
  for (let i = 0; i < 17; i++) {
    const idx = ALPHABET.indexOf(value[i]!);
    total += idx * WEIGHTS[i]!;
  }
  return ALPHABET[(31 - (total % 31)) % 31]!;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 18) {
    return err(
      "INVALID_LENGTH",
      "USCC must be 18 characters",
    );
  }

  if (!isdigits(v.slice(0, 8))) {
    return err(
      "INVALID_FORMAT",
      "USCC positions 1-8 must be digits",
    );
  }

  for (let i = 8; i < 18; i++) {
    if (!ALPHABET.includes(v[i]!)) {
      return err(
        "INVALID_FORMAT",
        "USCC contains invalid character",
      );
    }
  }

  if (v[17] !== calcCheckChar(v)) {
    return err(
      "INVALID_CHECKSUM",
      "USCC check character does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Chinese Unified Social Credit Code. */
const uscc: Validator = {
  name: "Unified Social Credit Code",
  localName: "统一社会信用代码",
  abbreviation: "USCC",
  country: "CN",
  entityType: "company",
  description:
    "18-character tax/registration code for Chinese entities",
  sourceUrl:
    "https://zh.wikipedia.org/wiki/统一社会信用代码",
  lengths: [18] as const,
  examples: ["91110000600037341L"] as const,
  compact,
  format,
  validate,
};

export default uscc;
export { compact, format, validate };

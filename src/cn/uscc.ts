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

import type { ValidateResult, Validator } from "../types";

import { clean } from "#util/clean";
import {
  randomChar,
  randomDigits,
  randomInt,
} from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const ALPHABET = "0123456789ABCDEFGHJKLMNPQRTUWXY";

const WEIGHTS = [
  1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10,
  30, 28,
] as const;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const calcCheckChar = (value: string): string => {
  let total = 0;
  for (const [i, weight] of WEIGHTS.entries()) {
    const ch = value[i];
    if (ch === undefined) continue;
    total += ALPHABET.indexOf(ch) * weight;
  }
  // SAFETY: (31 - total % 31) % 31 is in 0..30 and
  // ALPHABET has 31 characters.
  // eslint-disable-next-line no-non-null-assertion
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

  for (const ch of v) {
    if (!ALPHABET.includes(ch)) {
      return err(
        "INVALID_FORMAT",
        "USCC contains invalid character",
      );
    }
  }

  if (!isdigits(v.slice(2, 8))) {
    return err(
      "INVALID_FORMAT",
      "USCC region code (positions 3-8) must be digits",
    );
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

/** Generate a random valid USCC. */
const generate = (): string => {
  // SAFETY: indices 1..9 are within ALPHABET (31 chars).
  // eslint-disable-next-line no-non-null-assertion
  const reg = ALPHABET[randomInt(1, 9)]!;
  // eslint-disable-next-line no-non-null-assertion
  const etype = ALPHABET[randomInt(1, 9)]!;
  const region = randomDigits(6);
  let org = "";
  for (let i = 0; i < 9; i++) {
    org += randomChar(ALPHABET);
  }
  const payload = reg + etype + region + org;
  return payload + calcCheckChar(payload);
};

/** Chinese Unified Social Credit Code. */
const uscc: Validator = {
  name: "Unified Social Credit Code",
  localName: "统一社会信用代码",
  abbreviation: "USCC",
  aliases: ["统一社会信用代码", "USCC"] as const,
  candidatePattern:
    "[0-9A-HJ-NP-RTUW-Y]{2}\\d{6}[0-9A-HJ-NP-RTUW-Y]{10}",
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
  generate,
};

export default uscc;
export { compact, format, validate, generate };

/**
 * UBN (Unified Business Number, 統一編號).
 *
 * Taiwanese company identifier. 8 digits with a
 * weighted checksum. Weights [1,2,1,2,1,2,4,1];
 * sum the individual digits of each product, total
 * mod 10 must be 0. Special case: when the 7th digit
 * is 7, checksum 9 is also accepted.
 *
 * @see https://zh.wikipedia.org/wiki/統一編號
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [1, 2, 1, 2, 1, 2, 4, 1] as const;

/** Sum the individual digits of a number. */
const digitSum = (n: number): number => {
  let sum = 0;
  while (n > 0) {
    sum += n % 10;
    n = Math.floor(n / 10);
  }
  return sum;
};

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "UBN must be exactly 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "UBN must contain only digits",
    );
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digitSum(Number(v[i]) * WEIGHTS[i]!);
  }

  const checksum = sum % 10;
  if (checksum === 0) {
    return { valid: true, compact: v };
  }

  // Special case: when the 7th digit is 7 (product
  // 4*7=28), the checksum may be 9 instead of 0.
  if (checksum === 9 && v[6] === "7") {
    return { valid: true, compact: v };
  }

  return err(
    "INVALID_CHECKSUM",
    "UBN checksum does not match",
  );
};

const format = (value: string): string => compact(value);

/** Generate a random valid UBN. */
const generate = (): string => {
  for (;;) {
    const prefix = randomDigits(7);
    for (let d = 0; d < 10; d++) {
      const candidate = `${prefix}${d}`;
      const r = validate(candidate);
      if (r.valid) return candidate;
    }
  }
};

/** Taiwanese Unified Business Number. */
const ubn: Validator = {
  name: "Unified Business Number",
  localName: "統一編號",
  abbreviation: "UBN",
  aliases: ["統一編號", "UBN"] as const,
  candidatePattern: "\\d{8}",
  country: "TW",
  entityType: "company",
  description:
    "8-digit company identifier issued by the Ministry of Economic Affairs",
  sourceUrl:
    "https://zh.wikipedia.org/wiki/%E7%B5%B1%E4%B8%80%E7%B7%A8%E8%99%9F",
  lengths: [8] as const,
  examples: ["00501503", "04595257"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ubn;
export { compact, format, generate, validate };

/**
 * BRN (Business Registration Number, 사업자등록번호).
 *
 * Korean Business Registration Number. 10 digits
 * formatted as XXX-XX-XXXXX with a weighted
 * checksum.
 *
 * @see https://en.wikipedia.org/wiki/Business_registration_number_(South_Korea)
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [1, 3, 7, 1, 3, 7, 1, 3, 5] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "BRN must be exactly 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "BRN must contain only digits",
    );
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const weighted = Number(v[i]) * WEIGHTS[i]!;
    sum += i === 8
      ? weighted + Math.floor((weighted * 10) / 100)
      : weighted;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(v[9])) {
    return err(
      "INVALID_CHECKSUM",
      "BRN check digit does not match",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`;
};

/** Generate a random valid BRN. */
const generate = (): string => {
  const payload = randomDigits(9);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const weighted = Number(payload[i]) * WEIGHTS[i]!;
    sum += i === 8
      ? weighted + Math.floor((weighted * 10) / 100)
      : weighted;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${payload}${String(check)}`;
};

/** Korean Business Registration Number. */
const brn: Validator = {
  name: "Korean Business Registration Number",
  localName: "사업자등록번호",
  abbreviation: "BRN",
  country: "KR",
  entityType: "company",
  description:
    "10-digit business identifier issued by the National Tax Service",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Business_registration_number_(South_Korea)",
  lengths: [10] as const,
  examples: ["1168200131", "2208162517"] as const,
  compact,
  format,
  validate,
  generate,
};

export default brn;
export { compact, format, generate, validate };

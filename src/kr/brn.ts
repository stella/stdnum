/** Generate a random valid Korean BRN. */
const generate = (): string => {
  const office = String(randomInt(101, 999));
  let bizType: string;
  do {
    bizType = randomDigits(2);
  } while (bizType === "00");
  let serial: string;
  do {
    serial = randomDigits(4);
  } while (serial === "0000");
  const last = randomDigits(1);
  return `${office}${bizType}${serial}${last}`;
};

/**
 * BRN (Business Registration Number, 사업자등록번호).
 *
 * Korean Business Registration Number. 10 digits
 * formatted as XXX-XX-XXXXX. Validated by component
 * checks (tax office, business type, serial).
 *
 * @see https://en.wikipedia.org/wiki/Business_registration_number_(South_Korea)
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits, randomInt } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

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
  // Tax office number must be >= 101
  if (v.slice(0, 3) < "101") {
    return err(
      "INVALID_COMPONENT",
      "BRN tax office code must be >= 101",
    );
  }
  // Business type must not be 00
  if (v.slice(3, 5) === "00") {
    return err(
      "INVALID_COMPONENT",
      "BRN business type must not be 00",
    );
  }
  // Serial part must not be 0000
  if (v.slice(5, 9) === "0000") {
    return err(
      "INVALID_COMPONENT",
      "BRN serial must not be 0000",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`;
};

/** Korean Business Registration Number. */
const brn: Validator = {
  name: "Korean Business Registration Number",
  localName: "사업자등록번호",
  abbreviation: "BRN",
  aliases: [
    "사업자등록번호",
    "BRN",
  ] as const,
  candidatePattern: "\\d{3}-?\\d{2}-?\\d{5}",
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
export { compact, format, validate, generate };

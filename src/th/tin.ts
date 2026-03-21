/**
 * TIN (Thai Tax Identification Number,
 * เลขประจำตัวผู้เสียภาษี).
 *
 * 13 digits. Individual TINs have first digit 1-8;
 * company TINs (MOA) start with 0. Both use a
 * weighted mod-11 check digit.
 *
 * @see https://www.rd.go.th/
 * @see https://en.wikipedia.org/wiki/Thai_identity_card
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "TIN must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "TIN must contain only digits",
    );
  }

  // First digit: 1-8 for individuals, 0 for companies
  const first = Number(v[0]);
  if (first > 8) {
    return err(
      "INVALID_COMPONENT",
      "TIN first digit must be 0-8",
    );
  }

  // Mod-11 check digit (position 13)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(v[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  if (check !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "TIN check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return (
    `${v[0]} ${v.slice(1, 5)} ` +
    `${v.slice(5, 10)} ${v.slice(10, 12)} ${v[12]}`
  );
};

/** Generate a random valid Thai TIN. */
const generate = (): string => {
  const first = String(randomInt(1, 8));
  const payload = first + randomDigits(11);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (13 - i) * Number(payload[i]);
  return payload + String((11 - (sum % 11)) % 10);
};

/** Thai Tax Identification Number. */
const tin: Validator = {
  name: "Thai Tax Identification Number",
  localName: "เลขประจำตัวผู้เสียภาษี",
  abbreviation: "TIN",
  country: "TH",
  entityType: "any",
  description:
    "13-digit tax identifier for individuals and companies",
  sourceUrl: "https://www.rd.go.th/",
  lengths: [13] as const,
  examples: [
    "1101700230708",
    "3100600445015",
  ] as const,
  compact,
  format,
  validate,
  generate,
};

export default tin;
export { compact, format, validate, generate };

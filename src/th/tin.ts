/**
 * TIN (Thai Tax Identification Number,
 * เลขประจำตัวผู้เสียภาษี).
 *
 * 13 digits for individuals, 10 digits for
 * companies. Both use a weighted mod-11 check
 * digit. Individual TINs have first digit 1-8.
 *
 * @see https://www.rd.go.th/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10 && v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "TIN must be 10 or 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "TIN must contain only digits",
    );
  }

  if (v.length === 13) {
    // Individual TIN: first digit 1-8
    const first = Number(v[0]);
    if (first < 1 || first > 8) {
      return err(
        "INVALID_COMPONENT",
        "Individual TIN first digit must be 1-8",
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
  }

  if (v.length === 10) {
    // Company TIN: mod-11 check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(v[i]) * (10 - i);
    }
    const check = (11 - (sum % 11)) % 10;
    if (check !== Number(v[9])) {
      return err(
        "INVALID_CHECKSUM",
        "TIN check digit does not match",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 13) {
    return (
      `${v[0]} ${v.slice(1, 5)} ` +
      `${v.slice(5, 10)} ${v.slice(10, 12)} ${v[12]}`
    );
  }
  // 10-digit company
  return `${v.slice(0, 4)} ${v.slice(4, 9)} ${v[9]}`;
};

/** Thai Tax Identification Number. */
const tin: Validator = {
  name: "Thai Tax Identification Number",
  localName: "เลขประจำตัวผู้เสียภาษี",
  abbreviation: "TIN",
  country: "TH",
  entityType: "any",
  description:
    "13-digit individual or 10-digit company tax identifier",
  sourceUrl: "https://www.rd.go.th/",
  lengths: [10, 13] as const,
  examples: [
    "1101700230708",
    "3100600445015",
  ] as const,
  compact,
  format,
  validate,
};

export default tin;
export { compact, format, validate };

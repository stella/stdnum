/**
 * ΦΠΑ (Cypriot VAT number).
 *
 * 8 digits + 1 check letter. Cannot start with "12".
 *
 * @see https://www.vatify.eu/cyprus-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/cyprus-tin.pdf
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const ODD_MAP: Record<number, number> = {
  0: 1,
  1: 0,
  2: 5,
  3: 7,
  4: 9,
  5: 13,
  6: 15,
  7: 17,
  8: 19,
  9: 21,
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("CY") || v.startsWith("cy")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Cypriot VAT number must be 8 digits + 1 letter",
    );
  }
  const digits = v.slice(0, 8);
  const checkLetter = v[8];
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Cypriot VAT number must start with 8 digits",
    );
  }
  if (!LETTERS.includes(checkLetter)) {
    return err(
      "INVALID_FORMAT",
      "Cypriot VAT number must end with a letter",
    );
  }
  if (v.startsWith("12")) {
    return err(
      "INVALID_COMPONENT",
      "Cypriot VAT number cannot start with 12",
    );
  }
  let odd = 0;
  let even = 0;
  for (let i = 0; i < 8; i++) {
    const d = Number(digits[i]);
    if (i % 2 === 0) {
      // Odd position (1-indexed: 1,3,5,7)
      odd += ODD_MAP[d];
    } else {
      // Even position (1-indexed: 2,4,6,8)
      even += d;
    }
  }
  const expected = LETTERS[(odd + even) % 26];
  if (checkLetter !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "Cypriot VAT number check letter mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `CY${compact(value)}`;

/** Cypriot VAT Number. */
const vat: Validator = {
  name: "Cypriot VAT Number",
  localName: "Αριθμός Εγγραφής Φ.Π.Α.",
  abbreviation: "ΦΠΑ",
  country: "CY",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

/**
 * HKID (Hong Kong Identity Card number).
 *
 * 1-2 letters + 6 digits + check digit in parentheses.
 * The check digit is computed via a weighted sum mod 11,
 * where letters have values A=10, B=11, ..., Z=35.
 * A remainder of 10 yields check digit 'A'.
 *
 * @see https://en.wikipedia.org/wiki/Hong_Kong_identity_card
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/** Strip spaces, parentheses, and dashes. */
const compact = (value: string): string =>
  clean(value, " -()").toUpperCase();

/**
 * Compute the weighted check character.
 *
 * For a two-letter prefix the weights are 9,8,7,6,5,4,3,2
 * over the 8 characters (2 letters + 6 digits). For a
 * single-letter prefix, a space (value 36) is prepended
 * so the weights stay the same.
 */
const computeCheck = (body: string): string => {
  const padded =
    body.length === 7 ? ` ${body}` : body;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const ch = padded[i]!;
    let val: number;
    if (ch === " ") {
      val = 36;
    } else if (ch >= "A" && ch <= "Z") {
      val = ch.charCodeAt(0) - 55; // A=10
    } else {
      val = Number(ch);
    }
    sum += val * (9 - i);
  }

  const remainder = sum % 11;
  if (remainder === 0) return "0";
  if (remainder === 1) return "A";
  return String(11 - remainder);
};

const HKID_RE = /^[A-Z]{1,2}\d{6}[0-9A]$/;

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "HKID must be 8 or 9 characters",
    );
  }
  if (!HKID_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "HKID must be 1-2 letters, 6 digits, "
        + "and a check character",
    );
  }

  const body = v.slice(0, -1);
  const check = v.slice(-1);
  if (computeCheck(body) !== check) {
    return err(
      "INVALID_CHECKSUM",
      "HKID check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const prefix = v.slice(0, -7);
  const digits = v.slice(-7, -1);
  const check = v.slice(-1);
  return `${prefix}${digits}(${check})`;
};

/** Hong Kong Identity Card number. */
const hkid: Validator = {
  name: "Hong Kong Identity Card Number",
  localName: "Hong Kong Identity Card Number",
  abbreviation: "HKID",
  country: "HK",
  entityType: "person",
  lengths: [8, 9],
  examples: ["G123456A", "AB9876543"],
  description:
    "Identity card number issued by the Hong Kong "
    + "Immigration Department",
  sourceUrl:
    "https://en.wikipedia.org/wiki/"
    + "Hong_Kong_identity_card",
  compact,
  format,
  validate,
};

export default hkid;
export { compact, format, validate };

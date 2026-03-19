/**
 * UID (Umsatzsteuer-Identifikationsnummer).
 *
 * Austrian VAT identification number. Format:
 * "U" + 7 digits + 1 check digit. Uses a
 * modified Luhn algorithm.
 *
 * @see https://www.bmf.gv.at/
 */

import { luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/");
  if (v.startsWith("AT") || v.startsWith("at")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Austrian UID must be U + 8 digits",
    );
  }
  if (v[0] !== "U") {
    return err(
      "INVALID_COMPONENT",
      "Austrian UID must start with U",
    );
  }
  const digits = v.slice(1);
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Austrian UID must be U + 8 digits",
    );
  }
  const cs = luhnChecksum(digits.slice(0, 7));
  const check = (((6 - cs) % 10) + 10) % 10;
  if (check < 0 || check !== Number(digits[7])) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian UID check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `AT${compact(value)}`;

/** Austrian VAT Identification Number. */
const uid: Validator = {
  name: "Austrian VAT Number",
  localName: "Umsatzsteuer-Identifikationsnummer",
  abbreviation: "UID",
  country: "AT",
  entityType: "company",
  examples: ["U13585627"] as const,
  compact,
  format,
  validate,
};

export default uid;
export { compact, format, validate };

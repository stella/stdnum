/**
 * PVN (Latvian VAT number).
 *
 * 11 digits.
 *
 * Individuals:
 * - legacy personal codes: DDMMYY + century digit 0/1/2 + 4 digits
 * - since 1 July 2017: codes start with 3, the second digit is 2-9,
 *   and the remaining digits are random
 *
 * Entities:
 * - tax administration issued: 9XXXXXXXXXX
 * - enterprise register issued: 4XXXXXXXXXX / 5XXXXXXXXXX
 *
 * Canonical sources:
 * - OECD Latvia TIN sheet for the tax-facing formats
 * - PMLP page documenting the post-2017 personal code
 *
 * These are the reasons we accept the new personal
 * code shape (`3` + second digit `2-9`) without the
 * legacy birth-date checksum, and why we reject
 * legacy personal codes with century digits outside
 * 0/1/2.
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Latvia-TIN.pdf
 * @see https://www.pmlp.gov.lv/en/change-personal-identity-number
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("LV") || v.startsWith("lv")) {
    v = v.slice(2);
  }
  return v;
};

const PERS_WEIGHTS = [10, 5, 8, 4, 2, 1, 6, 3, 7, 9];

const checkPersonal = (v: string): boolean => {
  // Initial sum = 1 (not 0), so can't use
  // weightedSum directly
  let sum = 1;
  for (let i = 0; i < 10; i++) {
    // SAFETY: both arrays are length 10+
    // eslint-disable-next-line no-non-null-assertion
    sum += PERS_WEIGHTS[i]! * Number(v[i]);
  }
  return (sum % 11) % 10 === Number(v[10]);
};

const validateBirthDate = (v: string): boolean => {
  const day = Number(v.slice(0, 2));
  const month = Number(v.slice(2, 4));
  const year2 = Number(v.slice(4, 6));
  const century = Number(v[6]);
  if (century < 0 || century > 2) {
    return false;
  }
  const fullYear = 1800 + century * 100 + year2;
  const date = new Date(fullYear, month - 1, day);
  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Latvian VAT number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Latvian VAT number must contain only digits",
    );
  }
  if (
    v[0] === "3" &&
    v[1] !== undefined &&
    v[1] >= "2" &&
    v[1] <= "9"
  ) {
    // Since 1 July 2017, new personal codes start with 3
    // and are syntactic identifiers only.
    return { valid: true, compact: v };
  }

  const first = v[0];
  if (first === "4" || first === "5" || first === "9") {
    const sum = weightedSum(v, WEIGHTS, 11);
    if (sum !== 3) {
      return err(
        "INVALID_CHECKSUM",
        "Latvian VAT number check digit mismatch",
      );
    }
  } else {
    // Old-format personal code: first 6 digits encode
    // birth date as DDMMYY, digit 7 encodes century
    if (!validateBirthDate(v)) {
      return err(
        "INVALID_COMPONENT",
        "Latvian personal code has invalid birth date",
      );
    }
    if (!checkPersonal(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Latvian personal code check digit mismatch",
      );
    }
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `LV${compact(value)}`;

/** Generate a random valid Latvian VAT number. */
const generate = (): string => {
  const prefixes = ["4", "5", "9"] as const;
  for (;;) {
    const prefix = prefixes[randomInt(0, prefixes.length - 1)] ?? "4";
    const c = prefix + randomDigits(10);
    if (validate(c).valid) return c;
  }
};

/** Latvian VAT Number. */
const vat: Validator = {
  name: "Latvian VAT Number",
  localName: "PVN reģistrācijas numurs",
  abbreviation: "PVN",
  aliases: ["PVN reģistrācijas numurs", "PVN"] as const,
  candidatePattern: "LV\\d{11}",
  country: "LV",
  entityType: "any",
  sourceUrl:
    "https://www.pmlp.gov.lv/en/change-personal-identity-number",
  examples: ["40003521600"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

/**
 * ИН по ДДС (Bulgarian VAT number).
 *
 * 9 or 10 digits with weighted checksum.
 *
 * @see https://www.vatify.eu/bulgaria-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/bulgaria-tin.pdf
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("BG") || v.startsWith("bg")) {
    v = v.slice(2);
  }
  return v;
};

const d = (v: string, i: number): number => Number(v[i]);

const WEIGHTS_9_PASS1 = [1, 2, 3, 4, 5, 6, 7, 8];
const WEIGHTS_9_PASS2 = [3, 4, 5, 6, 7, 8, 9, 10];
const WEIGHTS_EGN = [2, 4, 8, 5, 10, 9, 7, 3, 6];
const WEIGHTS_PNF = [21, 19, 17, 13, 11, 9, 7, 3, 1];
const WEIGHTS_OTHER = [4, 3, 2, 7, 6, 5, 4, 3, 2];

const validate9 = (v: string): boolean => {
  let check = weightedSum(
    v.slice(0, 8),
    WEIGHTS_9_PASS1,
    11,
  );
  if (check === 10) {
    check = weightedSum(v.slice(0, 8), WEIGHTS_9_PASS2, 11);
  }
  return check % 10 === d(v, 8);
};

/**
 * Validate a 10-digit EGN (personal code).
 * First 6 digits encode birth date (YYMMDD with month
 * offsets: +20 for 1800s, +40 for 2000s). Check digit
 * uses weights [2,4,8,5,10,9,7,3,6], sum % 11 % 10.
 */
const validateEgn = (v: string): boolean => {
  const year = d(v, 0) * 10 + d(v, 1);
  let month = d(v, 2) * 10 + d(v, 3);
  const day = d(v, 4) * 10 + d(v, 5);
  let fullYear = year + 1900;
  if (month > 40) {
    fullYear += 100;
    month -= 40;
  } else if (month > 20) {
    fullYear -= 100;
    month -= 20;
  }
  // Validate the birth date
  const date = new Date(fullYear, month - 1, day);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  const sum = weightedSum(v.slice(0, 9), WEIGHTS_EGN, 11);
  return sum % 10 === d(v, 9);
};

/**
 * Validate a 10-digit PNF (foreigner personal number).
 * Weights [21,19,17,13,11,9,7,3,1], sum % 10.
 */
const validatePnf = (v: string): boolean => {
  const sum = weightedSum(v.slice(0, 9), WEIGHTS_PNF, 10);
  return sum === d(v, 9);
};

/**
 * Validate a 10-digit "other" VAT number.
 * Weights [4,3,2,7,6,5,4,3,2], (11 - sum%11) % 11.
 */
const validateOther = (v: string): boolean => {
  const sum = weightedSum(v.slice(0, 9), WEIGHTS_OTHER, 11);
  return (11 - sum) % 11 === d(v, 9);
};

const validate10 = (v: string): boolean =>
  validateEgn(v) || validatePnf(v) || validateOther(v);

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Bulgarian VAT number must be 9 or 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Bulgarian VAT number must contain only digits",
    );
  }
  const valid =
    v.length === 9 ? validate9(v) : validate10(v);
  if (!valid) {
    return err(
      "INVALID_CHECKSUM",
      "Bulgarian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `BG${compact(value)}`;

/** Generate a random valid 9-digit Bulgarian VAT. */
const generate = (): string => {
  for (;;) {
    const c = randomDigits(9);
    if (validate(c).valid) return c;
  }
};

/** Bulgarian VAT Number. */
const vat: Validator = {
  name: "Bulgarian VAT Number",
  localName: "ИН по ДДС",
  abbreviation: "ИН по ДДС",
  aliases: [
    "ДДС",
    "идентификационен номер по ДДС",
  ] as const,
  candidatePattern: "BG\\d{9,10}",
  country: "BG",
  entityType: "any",
  sourceUrl: "https://www.nra.bg/",
  examples: ["175074752"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

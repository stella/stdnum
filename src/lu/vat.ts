/**
 * TVA (Luxembourg VAT number).
 *
 * 8 digits. First 6 digits mod 89 === last 2 digits.
 *
 * @see https://www.vatify.eu/luxembourg-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/luxembourg-tin.pdf
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("LU") || v.startsWith("lu")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Luxembourg VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Luxembourg VAT number must contain only digits",
    );
  }
  const front = Number.parseInt(v.slice(0, 6), 10);
  const check = Number.parseInt(v.slice(6, 8), 10);
  if (front % 89 !== check) {
    return err(
      "INVALID_CHECKSUM",
      "Luxembourg VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `LU${compact(value)}`;

/** Luxembourg VAT Number. */
const vat: Validator = {
  name: "Luxembourg VAT Number",
  localName: "Numéro de TVA",
  abbreviation: "TVA",
  aliases: [
    "TVA",
    "numéro d'identification TVA",
  ] as const,
  candidatePattern: "LU\\d{8}",
  country: "LU",
  entityType: "company",
  sourceUrl: "https://pfi.public.lu/",
  examples: ["15027442"] as const,
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

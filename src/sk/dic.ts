/**
 * IČ DPH (Identifikačné číslo pre daň z
 * pridanej hodnoty).
 *
 * Slovak VAT number. Format: "SK" + 10 digits.
 * The 10-digit number must be divisible by 11.
 * First digit is 1-9.
 *
 * @see https://www.financnasprava.sk/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import { validate as validateRc } from "../cz/rc";
import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  const v = clean(value, " -");
  if (v.startsWith("SK") || v.startsWith("sk")) {
    return v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Slovak VAT number must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Slovak VAT number must contain only digits",
    );
  }
  // A valid birth number is also accepted as DPH
  if (validateRc(v).valid) {
    return { valid: true, compact: v };
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Slovak VAT number cannot start with 0",
    );
  }
  // Third digit must be 2, 3, 4, 7, 8, or 9
  const d3 = Number(v[2]);
  if (
    d3 !== 2 &&
    d3 !== 3 &&
    d3 !== 4 &&
    d3 !== 7 &&
    d3 !== 8 &&
    d3 !== 9
  ) {
    return err(
      "INVALID_FORMAT",
      "Slovak VAT number has invalid third digit",
    );
  }
  if (Number(v) % 11 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Slovak VAT number is not divisible by 11",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `SK${compact(value)}`;

/** Slovak VAT Number. */
const dic: Validator = {
  name: "Slovak VAT Number",
  localName:
    "Identifikačné číslo pre daň z pridanej hodnoty",
  abbreviation: "IČ DPH",
  aliases: [
    "DIČ",
    "daňové identifikačné číslo",
  ] as const,
  candidatePattern: "SK\\d{10}",
  country: "SK",
  entityType: "company",
  sourceUrl: "https://www.financnasprava.sk/",
  examples: ["2021853504"] as const,
  compact,
  format,
  validate,
};

export default dic;
export { compact, format, validate };

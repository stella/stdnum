/**
 * TIN (Abgabenkontonummer).
 *
 * Austrian tax identification number. 9 digits:
 * 2-digit tax office code (Finanzamtsnummer) +
 * 6-digit subject number + 1 check digit.
 * Uses a variant of the Luhn algorithm.
 *
 * @see https://de.wikipedia.org/wiki/Abgabenkontonummer
 * @see https://service.bmf.gv.at/Service/Anwend/Behoerden/show_mast.asp
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/** Luhn-variant doubling table: position-dependent. */
const DOUBLE = "0246813579";

const compact = (value: string): string =>
  clean(value, " -./,");

const calcCheckDigit = (number: string): string => {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = Number(number[i]);
    // Even positions (0-indexed) add digit as-is;
    // odd positions use the doubling table
    sum += i % 2 === 0 ? d : Number(DOUBLE[d]);
  }
  return String((10 - (sum % 10)) % 10);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Austrian TIN must be exactly 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Austrian TIN must contain only digits",
    );
  }
  if (calcCheckDigit(v) !== v[8]) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian TIN check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}-${v.slice(2, 5)}/${v.slice(5)}`;
};

/** Austrian Tax Identification Number. */
const tin: Validator = {
  name: "Austrian Tax Identification Number",
  localName: "Abgabenkontonummer",
  abbreviation: "TIN",
  aliases: [
    "Steuernummer",
    "St.Nr.",
    "TIN",
  ] as const,
  candidatePattern: "\\d{2}-?\\d{3}/\\d{4}",
  country: "AT",
  entityType: "person",
  sourceUrl:
    "https://de.wikipedia.org/wiki/Abgabenkontonummer",
  examples: ["591199013"] as const,
  compact,
  format,
  validate,
};

export default tin;
export { compact, format, validate };

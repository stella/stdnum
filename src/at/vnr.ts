/**
 * VNR (Versicherungsnummer).
 *
 * Austrian social insurance number. 10 digits: 3-digit
 * serial + 1 check digit + 6-digit birth date (DDMMYY).
 * The check digit is computed using a weighted sum
 * mod 11 over the 9 non-check digits.
 *
 * @see https://de.wikipedia.org/wiki/Sozialversicherungsnummer#%C3%96sterreich
 * @see https://www.sozialversicherung.at/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Weights for the 9 non-check digits (positions
 * 0,1,2, then 4,5,6,7,8,9). Check digit is at
 * position 3 and equals the weighted sum mod 11.
 */
const WEIGHTS = [3, 7, 9, 5, 8, 4, 2, 1, 6];

const compact = (value: string): string =>
  clean(value, " -/").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Austrian VNR must be 10 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Austrian VNR must contain only digits",
    );
  }

  // Validate birth date (DDMMYY in positions 4-9)
  const day = Number(v.slice(4, 6));
  const month = Number(v.slice(6, 8));
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return err(
      "INVALID_COMPONENT",
      "Austrian VNR contains an invalid birth date",
    );
  }

  // Check digit at position 3: weighted sum of the
  // other 9 digits mod 11. If remainder is 10 the
  // number is invalid.
  const digits = v.slice(0, 3) + v.slice(4);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * WEIGHTS[i]!;
  }
  const check = sum % 11;
  if (check === 10) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian VNR check digit is invalid (mod 11 " +
        "remainder is 10)",
    );
  }
  if (check !== Number(v[3])) {
    return err(
      "INVALID_CHECKSUM",
      "Austrian VNR check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 4)} ${v.slice(4, 6)}${v.slice(6, 8)}${v.slice(8)}`;
};

/** Austrian Social Insurance Number. */
const vnr: Validator = {
  name: "Austrian Social Insurance Number",
  localName: "Versicherungsnummer",
  abbreviation: "VNR",
  aliases: [
    "VNR",
    "SVNR",
    "Versicherungsnummer",
    "Sozialversicherungsnummer",
  ] as const,
  candidatePattern: "\\d{4}\\s?\\d{6}",
  country: "AT",
  entityType: "person",
  sourceUrl:
    "https://de.wikipedia.org/wiki/Sozialversicherungsnummer",
  lengths: [10] as const,
  examples: ["1237010180"] as const,
  compact,
  format,
  validate,
};

export default vnr;
export { compact, format, validate };

/**
 * Identity Number (Mispar Zehut, מספר זהות).
 *
 * Israeli personal identity number. 9 digits
 * (zero-padded) with a Luhn checksum.
 *
 * @see https://en.wikipedia.org/wiki/Israeli_identity_card
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -").padStart(9, "0");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length > 9) {
    return err(
      "INVALID_LENGTH",
      "Israeli ID must be at most 9 digits",
    );
  }
  if (!isdigits(v) || Number(v) === 0) {
    return err(
      "INVALID_FORMAT",
      "Israeli ID must contain only digits" +
        " and not be zero",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Israeli ID Luhn check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, -1)}-${v.slice(-1)}`;
};

/** Israeli Identity Number (Mispar Zehut). */
const idnr: Validator = {
  name: "Israeli Identity Number",
  localName: "מספר זהות",
  abbreviation: "ת.ז.",
  aliases: [
    "תעודת זהות",
    "Teudat Zehut",
    "ID number",
  ] as const,
  candidatePattern: "\\d{9}",
  country: "IL",
  entityType: "person",
  compact,
  format,
  validate,
  description:
    "Israeli personal identification number" +
    " (Mispar Zehut)",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Israeli_identity_card",
  lengths: [9] as const,
  examples: ["039337423", "000000018"] as const,
};

export default idnr;
export { compact, format, validate };

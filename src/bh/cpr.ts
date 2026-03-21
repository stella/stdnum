/**
 * CPR (Central Population Registration number, Bahrain).
 *
 * 9-digit personal identification number:
 *   YYMM  = year and month of birth
 *   NNNN  = serial number
 *   C     = check digit
 *
 * The check digit algorithm is not publicly
 * documented; validation is structural only
 * (length, digits, and valid birth month).
 *
 * Note: a minority of older CPR numbers do not
 * follow the YYMMNNNNC format.
 *
 * @see https://www.bahrain.bh/wps/portal/IDInfo_en
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Bahrain CPR must be 9 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Bahrain CPR must contain only digits",
    );
  }

  // Validate birth month (digits 3-4) is 01-12
  const mm = Number(v.slice(2, 4));
  if (mm < 1 || mm > 12) {
    return err(
      "INVALID_COMPONENT",
      "CPR birth month must be 01-12",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}-${v.slice(2, 4)}-${v.slice(4)}`;
};

/** Bahrain Central Population Registration number. */
const cpr: Validator = {
  name: "Central Population Registration Number",
  localName: "الرقم السكاني",
  abbreviation: "CPR",
  aliases: [
    "الرقم السكاني",
    "CPR",
    "Personal Number",
  ] as const,
  candidatePattern: "\\d{9}",
  country: "BH",
  entityType: "person",
  lengths: [9] as const,
  examples: ["890112345", "000612345"] as const,
  description:
    "9-digit personal identification number",
  sourceUrl:
    "https://www.bahrain.bh/wps/portal/IDInfo_en",
  compact,
  format,
  validate,
};

export default cpr;
export { compact, format, validate };

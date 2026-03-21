/**
 * NPWP (Nomor Pokok Wajib Pajak, Indonesian tax ID).
 *
 * 15 or 16 digits. The 15-digit (legacy) format has a
 * Luhn check on the first 9 digits. The 16-digit format
 * is either a NIK (starts with non-zero) validated as a
 * 16-digit number with date/Luhn checks, or the legacy
 * format prefixed with 0 (Luhn on first 10 digits).
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Indonesia-TIN.pdf
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " .-");

/**
 * Valid 2-digit province codes for NIK, sourced from
 * python-stdnum's id/loc numdb.
 */
const NIK_PROVINCES = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18",
  "19", "21", "31", "32", "33", "34", "35", "36",
  "51", "52", "53", "61", "62", "63", "64",
  "71", "72", "73", "74", "75", "76",
  "81", "82", "91", "94",
]);

/**
 * Validate a 16-digit NIK (Nomor Induk Kependudukan).
 * Format: PPRRSSDDMMYYXXXX where PP = province,
 * RRSS = regency/city + sub-district,
 * DDMMYY = birth date (DD+40 for females),
 * XXXX = serial.
 */
const validateNik = (
  v: string,
): ValidateResult => {
  // Province code check
  if (!NIK_PROVINCES.has(v.slice(0, 2))) {
    return err(
      "INVALID_COMPONENT",
      "NIK province code is invalid",
    );
  }
  let day = Number(v.slice(6, 8));
  const month = Number(v.slice(8, 10));
  const year = Number(v.slice(10, 12));
  // Females have 40 added to the day
  if (day > 40) day -= 40;
  // Validate the date (century is ambiguous in NIK)
  if (
    !isValidDate(1900 + year, month, day)
    && !isValidDate(2000 + year, month, day)
  ) {
    return err(
      "INVALID_COMPONENT",
      "NIK contains an invalid date",
    );
  }
  return { valid: true, compact: v };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NPWP must contain only digits",
    );
  }
  if (v.length === 15) {
    // Legacy 15-digit format: Luhn on first 9 digits
    if (!luhnValidate(v.slice(0, 9))) {
      return err(
        "INVALID_CHECKSUM",
        "NPWP Luhn check on first 9 digits failed",
      );
    }
    return { valid: true, compact: v };
  }
  if (v.length === 16) {
    if (v[0] !== "0") {
      // NIK format
      return validateNik(v);
    }
    // 0-prefixed legacy: Luhn on first 10 digits
    if (!luhnValidate(v.slice(0, 10))) {
      return err(
        "INVALID_CHECKSUM",
        "NPWP Luhn check on first 10 digits failed",
      );
    }
    return { valid: true, compact: v };
  }
  return err(
    "INVALID_LENGTH",
    "NPWP must be 15 or 16 digits",
  );
};

const format = (value: string): string => {
  const v = compact(value);
  return (
    `${v.slice(0, 2)}.${v.slice(2, 5)}.`
    + `${v.slice(5, 8)}.${v.slice(8, 9)}`
    + `-${v.slice(9, 12)}.${v.slice(12)}`
  );
};

/** Indonesian Taxpayer Identification Number. */
const npwp: Validator = {
  name: "Indonesian Taxpayer Identification Number",
  localName: "Nomor Pokok Wajib Pajak",
  abbreviation: "NPWP",
  country: "ID",
  entityType: "any",
  lengths: [15],
  examples: ["013000666091000", "016090524017000"],
  description:
    "15-digit tax identification number issued by "
    + "the Directorate General of Taxes",
  sourceUrl:
    "https://en.wikipedia.org/wiki/"
    + "Tax_identification_number#Indonesia",
  compact,
  format,
  validate,
};

export default npwp;
export { compact, format, validate };

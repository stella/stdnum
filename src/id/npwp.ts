/**
 * NPWP (Nomor Pokok Wajib Pajak, Indonesian tax ID).
 *
 * 15 digits formatted as XX.XXX.XXX.X-XXX.XXX.
 * No checksum; format/length validation only.
 *
 * @see https://en.wikipedia.org/wiki/Tax_identification_number#Indonesia
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " .-");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "NPWP must be 15 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NPWP must contain only digits",
    );
  }
  return { valid: true, compact: v };
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
  examples: ["013000666091000", "013001238091000"],
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

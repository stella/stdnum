/**
 * PhilID (Philippine Identification System Number,
 * PhilSys Card Number, PCN).
 *
 * 12-digit personal identifier issued under the
 * Philippine Identification System (PhilSys).
 * Formatted as XXXX-XXXXXXX-X. No check digit
 * algorithm is publicly documented.
 *
 * @see https://en.wikipedia.org/wiki/Philippine_national_identity_card
 * @see https://philsys.gov.ph/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "PhilID must be exactly 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "PhilID must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 12) {
    return `${v.slice(0, 4)}-${v.slice(4, 11)}-${v.slice(11)}`;
  }
  return v;
};

/** Philippine Identification System Number. */
const philid: Validator = {
  name: "Philippine Identification System Number",
  localName: "PhilSys Card Number",
  abbreviation: "PhilID",
  aliases: [
    "PhilID",
    "PhilSys",
    "Philippine Identification System Number",
  ] as const,
  candidatePattern:
    "\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}",
  country: "PH",
  entityType: "person",
  description:
    "12-digit personal identifier issued under" +
    " the Philippine Identification System",
  sourceUrl:
    "https://en.wikipedia.org/wiki/" +
    "Philippine_national_identity_card",
  lengths: [12] as const,
  examples: [
    "123456789012",
    "000011112222",
  ] as const,
  compact,
  format,
  validate,
};

export default philid;
export { compact, format, validate };

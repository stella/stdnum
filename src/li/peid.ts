/** Generate a random valid Liechtenstein PEID. */
const generate = (): string => {
  const len = randomInt(4, 12);
  const first = String(randomInt(1, 9));
  return first + randomDigits(len - 1);
};

/**
 * PEID (Personenidentifikationsnummer).
 *
 * Liechtenstein tax code for individuals and entities.
 * Numeric code of 4 to 12 digits, with leading zeros
 * stripped during compaction.
 *
 * @see https://www.oera.li/
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " .").replace(/^0+/, "");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 4 || v.length > 12) {
    return err(
      "INVALID_LENGTH",
      "Liechtenstein PEID must be 4 to 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Liechtenstein PEID must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Liechtenstein Person Identification Number. */
const peid: Validator = {
  name: "Liechtenstein Person Identification Number",
  localName: "Personenidentifikationsnummer",
  abbreviation: "PEID",
  aliases: ["PEID", "Personenidentifikation"] as const,
  candidatePattern: "\\d{6}",
  country: "LI",
  entityType: "any",
  lengths: [4, 5, 6, 7, 8, 9, 10, 11, 12] as const,
  sourceUrl: "https://www.oera.li/",
  examples: ["1234567"] as const,
  compact,
  format,
  validate,
  generate,
};

export default peid;
export { compact, format, validate, generate };

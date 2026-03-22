/** Generate a random valid Nigerian NIN. */
const generate = (): string => randomDigits(11);

/**
 * NIN (National Identification Number, Nigeria).
 *
 * 11-digit number randomly assigned by NIMC (National
 * Identity Management Commission). No checksum; the
 * digits are non-intelligible and carry no embedded
 * meaning. Once assigned, a NIN is permanent and
 * cannot be reassigned.
 *
 * @see https://nimc.gov.ng/about-nin/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Nigerian NIN must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Nigerian NIN must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 7)} ${v.slice(7)}`;
};

/** Nigerian National Identification Number. */
const nin: Validator = {
  name: "National Identification Number",
  localName: "National Identification Number",
  abbreviation: "NIN",
  aliases: ["NIN", "National Identification Number"] as const,
  candidatePattern: "\\d{11}",
  country: "NG",
  entityType: "person",
  lengths: [11] as const,
  examples: ["13478900989", "70123456789"] as const,
  description:
    "11-digit national identity number issued by NIMC",
  sourceUrl: "https://nimc.gov.ng/about-nin/",
  compact,
  format,
  validate,
  generate,
};

export default nin;
export { compact, format, validate, generate };

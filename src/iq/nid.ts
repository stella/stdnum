/** Generate a random valid Iraqi NID. */
const generate = (): string => randomDigits(12);

/**
 * NID (Iraqi National ID, البطاقة الوطنية الموحدة).
 *
 * 12-digit personal identification number on the
 * Iraqi National Card (Unified National Card), issued
 * by the Ministry of Interior since 2016.
 *
 * No public checksum algorithm is documented.
 * Validation is limited to format: exactly 12 decimal
 * digits. Accepts both Arabic-Indic (U+066x) and
 * Extended Arabic-Indic (U+06Fx) digits.
 *
 * @see https://mofa.gov.iq/the-civil-status-id/
 */

import { clean } from "#util/clean";
import { normalizeArabicDigits } from "#util/arabic";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  normalizeArabicDigits(clean(value, " -./"));

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Iraqi NID must be exactly 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Iraqi NID must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

/** Iraqi NIDs are displayed without separators. */
const format = (value: string): string => compact(value);

/** Iraqi National Identification Number. */
const nid: Validator = {
  name: "Iraqi National ID",
  localName: "البطاقة الوطنية الموحدة",
  abbreviation: "NID",
  aliases: ["NID", "البطاقة الوطنية الموحدة"] as const,
  candidatePattern: "\\d{12}",
  country: "IQ",
  entityType: "person",
  sourceUrl: "https://mofa.gov.iq/the-civil-status-id/",
  description:
    "Iraqi personal identification number (National Card)",
  lengths: [12] as const,
  examples: ["012345678901"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nid;
export { compact, format, validate, generate };

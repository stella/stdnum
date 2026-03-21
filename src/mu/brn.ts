/**
 * BRN (Business Registration Number, Mauritius).
 *
 * Issued by the Corporate and Business Registration
 * Department (CBRD). Used to identify entities and
 * individuals carrying out business activities.
 *
 * Entity BRN: 1 letter prefix + 8 digits (9 chars).
 *   - Letter indicates entity type (e.g. C = company,
 *     F = foreign company).
 *   - Digits 2-3 encode the registration year
 *     (e.g. 07 = 2007).
 *   - Digits 4-9 are a sequential number.
 *
 * Individual BRN: 8 digits, first digit 0-3.
 *
 * No public check digit algorithm is documented.
 *
 * @see https://companies.govmu.org/
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/mauritius-tin.pdf
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/** Entity BRN: letter + 8 digits. */
const ENTITY_RE = /^[A-Z]\d{8}$/;

/** Individual BRN: 8 digits, starts with 0-3. */
const INDIVIDUAL_RE = /^[0-3]\d{7}$/;

const compact = (value: string): string =>
  clean(value, " -/").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Mauritius BRN must be 8 or 9 characters",
    );
  }

  if (v.length === 9) {
    if (!ENTITY_RE.test(v)) {
      return err(
        "INVALID_FORMAT",
        "Mauritius entity BRN must be " +
          "1 letter followed by 8 digits",
      );
    }
  } else {
    if (!INDIVIDUAL_RE.test(v)) {
      return err(
        "INVALID_FORMAT",
        "Mauritius individual BRN must be " +
          "8 digits starting with 0-3",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string =>
  compact(value);

/** Mauritius Business Registration Number. */
const brn: Validator = {
  name: "Mauritius Business Registration Number",
  localName: "Business Registration Number",
  abbreviation: "BRN",
  aliases: [
    "BRN",
    "Business Registration Number",
  ] as const,
  candidatePattern: "[A-Z]\\d{8}",
  country: "MU",
  entityType: "any",
  compact,
  format,
  validate,
  description:
    "Mauritius business registration number " +
    "issued by the CBRD",
  sourceUrl: "https://companies.govmu.org/",
  lengths: [8, 9] as const,
  examples: ["C07015330", "C16135302"] as const,
};

export default brn;
export { compact, format, validate };

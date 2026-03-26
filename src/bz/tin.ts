/**
 * TIN (Belize Tax Identification Number).
 *
 * Issued by the Belize Tax Service Department to
 * individuals, sole proprietors, partnerships, and
 * companies. The base number is 6 digits generated
 * by the Revenue Management System. A 2-digit
 * suffix code may be appended to indicate entity
 * type:
 *   - 10: individual
 *   - 13: company
 *   - 66: company (alternate)
 *
 * The OECD spec mentions a 7th check digit that is
 * not visible to the taxpayer; in practice the
 * number circulates as 6 or 8 digits (6 + suffix).
 *
 * Formatted as NNNNNN-SS (when suffix is present).
 *
 * Source: OECD CRS TIN information sheet; Belize
 * Tax Service (https://bts.gov.bz/).
 *
 * PERSON/ENTITY
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Belize-TIN.pdf
 */

import { clean } from "#util/clean";
import {
  randomDigits,
  randomInt,
} from "#util/generate";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

/** Valid 2-digit suffix codes. */
const SUFFIX_CODES = ["10", "13", "66"] as const;

const compact = (value: string): string => {
  return clean(value, " -").trim();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 6 && v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Belize TIN must be 6 or 8 digits",
    );
  }

  if (!/^\d+$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Belize TIN must contain only digits",
    );
  }

  if (v.length === 8) {
    const suffix = v.slice(6);
    if (
      !SUFFIX_CODES.includes(
        suffix as (typeof SUFFIX_CODES)[number],
      )
    ) {
      return err(
        "INVALID_COMPONENT",
        "Belize TIN suffix must be 10, 13, or 66",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length <= 6) {
    return v;
  }
  return `${v.slice(0, 6)}-${v.slice(6)}`;
};

/** Generate a random valid Belize TIN. */
const generate = (): string => {
  const base = randomDigits(6);
  const suffixes = ["", ...SUFFIX_CODES] as const;
  const suffix =
    suffixes[randomInt(0, suffixes.length - 1)] ?? "";
  return `${base}${suffix}`;
};

/**
 * Belize Tax Identification Number.
 *
 * Examples derived from stdnum-js test suite.
 */
const tin: Validator = {
  name: "Belize Tax Identification Number",
  localName: "Tax Identification Number",
  abbreviation: "TIN",
  aliases: ["TIN"] as const,
  candidatePattern: "\\d{6}",
  country: "BZ",
  entityType: "any",
  lengths: [6, 8] as const,
  examples: ["000005", "00000510", "00000513"] as const,
  compact,
  format,
  validate,
  generate,
  description:
    "Belize tax number issued by the Belize Tax Service Department",
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Belize-TIN.pdf",
};

export default tin;
export { compact, format, generate, validate };

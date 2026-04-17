/** Generate a random valid Anguilla TIN. */
const generate = (): string => {
  const prefix = Math.random() < 0.5 ? "1" : "2";
  return prefix + randomDigits(9);
};

/**
 * TIN (Anguilla Tax Identification Number).
 *
 * Issued by the Inland Revenue Department (IRD) to
 * individuals and entities for tax purposes. The
 * number consists of 10 digits including a prefix
 * digit and check digit:
 *   - Prefix 1: individual TIN
 *   - Prefix 2: non-individual (business) TIN
 *
 * Formatted as XXXXX-XXXXX.
 *
 * Source: OECD CRS TIN information sheet.
 *
 * PERSON/ENTITY
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Anguilla-TIN.pdf
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  return clean(value, " -").trim();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Anguilla TIN must be 10 digits",
    );
  }

  if (!/^\d{10}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Anguilla TIN must contain only digits",
    );
  }

  const prefix = v[0];

  if (prefix !== "1" && prefix !== "2") {
    return err(
      "INVALID_COMPONENT",
      "Anguilla TIN must start with 1 (individual) or 2 (business)",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 5)}-${v.slice(5)}`;
};

/**
 * Anguilla Tax Identification Number.
 *
 * Examples derived from stdnum-js test suite
 * (format-only validation, no published check
 * digit algorithm).
 */
const tin: Validator = {
  name: "Anguilla Tax Identification Number",
  localName: "Tax Identification Number",
  abbreviation: "TIN",
  aliases: ["TIN"] as const,
  candidatePattern: "\\d{11}",
  country: "AI",
  entityType: "any",
  lengths: [10] as const,
  examples: ["1234567890", "2345678901"] as const,
  compact,
  format,
  validate,
  description:
    "Anguilla tax number issued by the Inland Revenue Department",
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Anguilla-TIN.pdf",
  generate,
};

export default tin;
export { compact, format, validate, generate };

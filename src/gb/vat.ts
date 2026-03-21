/**
 * VAT (Value Added Tax registration number).
 *
 * UK VAT number. Multiple formats: 9 or 12
 * digit standard, GD+3 (government), HA+3
 * (health authority). Standard numbers use a
 * weighted checksum mod 97.
 *
 * @see https://www.gov.uk/vat-registration
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;

const compact = (value: string): string => {
  let v = clean(value, " -.");
  if (v.startsWith("GB") || v.startsWith("gb")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const validateStandard = (v: string): ValidateResult => {
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "UK VAT must contain only digits",
    );
  }
  // Weighted sum of first 7 digits
  const sum = weightedSum(v.slice(0, 7), WEIGHTS, 97);
  // Check digits are digits 8-9
  const checkPart = Number(v.slice(7, 9));
  const total = (sum + checkPart) % 97;

  const prefix = Number(v.slice(0, 3));
  if (prefix >= 100) {
    // Numbers >= 100 000 000: remainder must be
    // 0, 42, or 55
    if (total !== 0 && total !== 42 && total !== 55) {
      return err(
        "INVALID_CHECKSUM",
        "UK VAT check digits mismatch",
      );
    }
  } else {
    if (total !== 0) {
      return err(
        "INVALID_CHECKSUM",
        "UK VAT check digits mismatch",
      );
    }
  }
  return { valid: true, compact: v };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  // Government departments: GD + 3 digits (< 500)
  if (v.startsWith("GD")) {
    const num = v.slice(2);
    if (num.length !== 3 || !isdigits(num)) {
      return err(
        "INVALID_FORMAT",
        "UK VAT GD number must be GD + 3 digits",
      );
    }
    if (Number(num) >= 500) {
      return err(
        "INVALID_COMPONENT",
        "UK VAT GD number must be < 500",
      );
    }
    return { valid: true, compact: v };
  }

  // Health authorities: HA + 3 digits (>= 500)
  if (v.startsWith("HA")) {
    const num = v.slice(2);
    if (num.length !== 3 || !isdigits(num)) {
      return err(
        "INVALID_FORMAT",
        "UK VAT HA number must be HA + 3 digits",
      );
    }
    if (Number(num) < 500) {
      return err(
        "INVALID_COMPONENT",
        "UK VAT HA number must be >= 500",
      );
    }
    return { valid: true, compact: v };
  }

  // Standard: 9 or 12 digits
  if (v.length !== 9 && v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "UK VAT must be 9 or 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "UK VAT must contain only digits",
    );
  }
  const result = validateStandard(v.slice(0, 9));
  if (!result.valid) return result;
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.startsWith("GD") || v.startsWith("HA")) {
    return `GB${v}`;
  }
  return `GB ${v.slice(0, 3)} ${v.slice(3, 7)} ${v.slice(7)}`;
};

/** UK VAT Registration Number. */
const vat: Validator = {
  name: "UK VAT Number",
  localName: "VAT Registration Number",
  abbreviation: "VAT",
  aliases: [
    "VAT registration number",
    "VAT number",
  ] as const,
  candidatePattern: "GB\\d{9,12}",
  country: "GB",
  entityType: "company",
  sourceUrl: "https://www.gov.uk/vat-registration",
  examples: ["980780684"] as const,
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

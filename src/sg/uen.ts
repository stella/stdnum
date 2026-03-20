/**
 * UEN (Singapore Unique Entity Number).
 *
 * 9 or 10 characters identifying businesses and
 * entities registered in Singapore. Three formats:
 *
 * - Business (ROB): 8 digits + 1 check letter
 * - Local company (ROC): 4-digit year + 5 digits
 *   + 1 check letter
 * - Other entities: R/S/T + 2-digit year + 2-letter
 *   entity type + 4 digits + 1 check letter
 *
 * @see https://www.uen.gov.sg/
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Singapore-TIN.pdf
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/** Check letter alphabet for "Other" format. */
const OTHER_ALPHA =
  "ABCDEFGHJKLMNPQRSTUVWX0123456789";

const ENTITY_TYPES = new Set([
  "CC", "CD", "CH", "CL", "CM", "CP", "CS", "CX",
  "DP", "FB", "FC", "FM", "FN", "GA", "GB", "GS",
  "HS", "LL", "LP", "MB", "MC", "MD", "MH", "MM",
  "MQ", "NB", "NR", "PA", "PB", "PF", "RF", "RP",
  "SM", "SS", "TC", "TU", "VH", "XL",
]);

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

/**
 * Validate Business (ROB) UEN (9 chars):
 * 8 digits + 1 check letter.
 */
const validateBusiness = (
  v: string,
): ValidateResult => {
  if (!isdigits(v.slice(0, 8))) {
    return err(
      "INVALID_FORMAT",
      "Business UEN must start with 8 digits",
    );
  }
  if (!/^[A-Z]$/.test(v[8]!)) {
    return err(
      "INVALID_FORMAT",
      "Business UEN must end with a letter",
    );
  }

  const weights = [10, 4, 9, 3, 8, 2, 7, 1];
  const checkAlpha = "XMKECAWLJDB";
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(v[i]) * weights[i]!;
  }
  const expected = checkAlpha[sum % 11];
  if (v[8] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "UEN check letter does not match",
    );
  }
  return { valid: true, compact: v };
};

/**
 * Validate Local Company (ROC) UEN (10 chars):
 * 9 digits (year prefix) + 1 check letter.
 */
const validateLocalCompany = (
  v: string,
): ValidateResult => {
  if (!isdigits(v.slice(0, 9))) {
    return err(
      "INVALID_FORMAT",
      "Company UEN must have 9 digits",
    );
  }
  if (!/^[A-Z]$/.test(v[9]!)) {
    return err(
      "INVALID_FORMAT",
      "Company UEN must end with a letter",
    );
  }

  const weights = [10, 8, 6, 4, 9, 7, 5, 3, 1];
  const checkAlpha = "ZKCMDNERGWH";
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(v[i]) * weights[i]!;
  }
  const expected = checkAlpha[sum % 11];
  if (v[9] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "UEN check letter does not match",
    );
  }
  return { valid: true, compact: v };
};

/**
 * Validate Other entity UEN (10 chars):
 * R/S/T + 2 digits + 2-letter type + 4 digits
 * + 1 check letter.
 */
const validateOther = (
  v: string,
): ValidateResult => {
  const prefix = v[0]!;
  if (
    prefix !== "R" &&
    prefix !== "S" &&
    prefix !== "T"
  ) {
    return err(
      "INVALID_COMPONENT",
      "Other UEN must start with R, S, or T",
    );
  }
  if (!isdigits(v.slice(1, 3))) {
    return err(
      "INVALID_FORMAT",
      "Other UEN positions 2-3 must be digits",
    );
  }
  const entityType = v.slice(3, 5);
  if (!ENTITY_TYPES.has(entityType)) {
    return err(
      "INVALID_COMPONENT",
      "Unknown entity type: " + entityType,
    );
  }
  if (!isdigits(v.slice(5, 9))) {
    return err(
      "INVALID_FORMAT",
      "Other UEN positions 6-9 must be digits",
    );
  }

  const weights = [4, 3, 5, 3, 10, 2, 2, 5, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const idx = OTHER_ALPHA.indexOf(v[i]!);
    if (idx === -1) {
      return err(
        "INVALID_FORMAT",
        `Unexpected character at position ${i + 1}: ${v[i]}`,
      );
    }
    sum += idx * weights[i]!;
  }
  const expected =
    OTHER_ALPHA[((sum - 5) % 11 + 11) % 11];
  if (v[9] !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "UEN check letter does not match",
    );
  }
  return { valid: true, compact: v };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 9 && v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "UEN must be 9 or 10 characters",
    );
  }

  if (!/^[A-Z0-9]+$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "UEN must contain only digits and letters",
    );
  }

  // 9 chars: business (ROB)
  if (v.length === 9) {
    return validateBusiness(v);
  }

  // 10 chars: first char digit => local company,
  // otherwise "other" entity
  if (isdigits(v[0]!)) {
    return validateLocalCompany(v);
  }
  return validateOther(v);
};

const format = (value: string): string =>
  compact(value);

/** Singapore Unique Entity Number. */
const uen: Validator = {
  name: "Singapore Unique Entity Number",
  localName: "Unique Entity Number",
  abbreviation: "UEN",
  country: "SG",
  entityType: "company",
  description:
    "9 or 10-character business identifier issued by ACRA",
  sourceUrl: "https://www.uen.gov.sg/",
  lengths: [9, 10] as const,
  examples: [
    "00192200M",
    "197401143C",
    "S16FC0121D",
  ] as const,
  compact,
  format,
  validate,
};

export default uen;
export { compact, format, validate };

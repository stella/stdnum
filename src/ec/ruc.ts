/**
 * RUC (Registro Único de Contribuyentes).
 *
 * Ecuadorian tax identification number. 13 digits:
 * - Digits 1-2: province code (01-24, 30, or 50)
 * - Digit 3: type indicator
 *   - 0-5: natural person (CI + establishment)
 *   - 6: public entity (or natural person fallback)
 *   - 9: juridical entity (public checksum first,
 *         then juridical fallback)
 *
 * Natural persons use a Luhn-like mod-10 checksum on
 * the first 10 digits. Public entities use a mod-11
 * checksum on the first 9 digits. Private companies
 * use a mod-11 checksum on the first 10 digits.
 *
 * @see https://www.sri.gob.ec/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -");

/** CI mod-10 checksum: weights [2,1,2,1,...], fold
 *  products > 9 by subtracting 9, sum mod 10 == 0. */
const ciChecksum = (digits: string): number => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const weight = i % 2 === 0 ? 2 : 1;
    let product = Number(digits[i]) * weight;
    if (product > 9) product -= 9;
    sum += product;
  }
  return sum % 10;
};

/** Weighted mod-11 checksum. */
const mod11Checksum = (
  digits: string,
  weights: readonly number[],
): number => {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i]!;
  }
  return sum % 11;
};

const PUBLIC_WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2, 1];
const JURIDICAL_WEIGHTS = [
  4, 3, 2, 7, 6, 5, 4, 3, 2, 1,
];

const isValidProvince = (v: string): boolean => {
  const province = v.slice(0, 2);
  return (
    (province >= "01" && province <= "24") ||
    province === "30" ||
    province === "50"
  );
};

const validateNatural = (
  v: string,
): ValidateResult | null => {
  if (v.slice(-3) === "000") return null;
  if (ciChecksum(v.slice(0, 10)) !== 0) return null;
  return { valid: true, compact: v };
};

const validatePublic = (
  v: string,
): ValidateResult | null => {
  if (v.slice(-4) === "0000") return null;
  if (mod11Checksum(v, PUBLIC_WEIGHTS) !== 0) return null;
  return { valid: true, compact: v };
};

const validateJuridical = (
  v: string,
): ValidateResult | null => {
  if (v.slice(-3) === "000") return null;
  if (mod11Checksum(v, JURIDICAL_WEIGHTS) !== 0) {
    return null;
  }
  return { valid: true, compact: v };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "RUC must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "RUC must contain only digits",
    );
  }
  if (!isValidProvince(v)) {
    return err(
      "INVALID_COMPONENT",
      "RUC province code is invalid",
    );
  }

  const typeDigit = Number(v[2]);

  if (typeDigit <= 5) {
    // Natural person
    const result = validateNatural(v);
    if (result) return result;
    return err(
      "INVALID_CHECKSUM",
      "RUC check digit does not match",
    );
  }

  if (typeDigit === 6) {
    // Public entity; fall back to natural person
    const pub = validatePublic(v);
    if (pub) return pub;
    const nat = validateNatural(v);
    if (nat) return nat;
    return err(
      "INVALID_CHECKSUM",
      "RUC check digit does not match",
    );
  }

  if (typeDigit === 9) {
    // Juridical RUC; try public checksum first, fall
    // back to juridical (matches python-stdnum).
    const pub = validatePublic(v);
    if (pub) return pub;
    const jur = validateJuridical(v);
    if (jur) return jur;
    return err(
      "INVALID_CHECKSUM",
      "RUC check digit does not match",
    );
  }

  return err(
    "INVALID_COMPONENT",
    "RUC type digit is invalid",
  );
};

const format = (value: string): string => compact(value);

/** Generate a random valid Ecuadorian RUC. */
const generate = (): string => {
  for (;;) {
    const province = String(randomInt(1, 24)).padStart(2, "0");
    const c = province + randomDigits(11);
    if (validate(c).valid) return c;
  }
};

/** Ecuadorian tax identification number. */
const ruc: Validator = {
  name: "Registro Único de Contribuyentes",
  localName: "Registro Único de Contribuyentes",
  abbreviation: "RUC",
  country: "EC",
  entityType: "any",
  description:
    "13-digit tax identification number issued by the SRI",
  sourceUrl: "https://www.sri.gob.ec/",
  lengths: [13] as const,
  examples: ["1792060346001", "1790011674001"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ruc;
export { compact, format, validate, generate };

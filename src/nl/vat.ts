/**
 * BTW (Dutch VAT number).
 *
 * 12 characters: 9 digits + "B" + 2 digits.
 * Mod 97 check: convert "NL" + number to numeric
 * (N=23, L=21, B=11), mod 97 === 1.
 *
 * @see https://www.vatify.eu/netherlands-vat-number.html
 * @see https://business.gov.nl/regulations/using-checking-vat-numbers/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("NL") || v.startsWith("nl")) {
    v = v.slice(2);
  }
  v = v.toUpperCase();
  // Zero-pad numeric part to 9 digits if B is found
  const bIdx = v.indexOf("B");
  if (bIdx > 0 && bIdx < 9) {
    v = v.slice(0, bIdx).padStart(9, "0") + v.slice(bIdx);
  }
  return v;
};

/**
 * Compute mod 97 of a string containing digits and
 * uppercase letters (A=10, B=11, ..., Z=35).
 */
const mod97 = (value: string): number => {
  let remainder = 0;
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      // Digit
      remainder = (remainder * 10 + (code - 48)) % 97;
    } else if (code >= 65 && code <= 90) {
      // Letter: two decimal digits (A=10, ..., Z=35)
      const num = code - 55;
      remainder = (remainder * 100 + num) % 97;
    }
  }
  return remainder;
};

/**
 * Check if a 9-digit string is a valid BSN (Dutch citizen
 * identification number). Weights [9,8,7,6,5,4,3,2,-1],
 * sum % 11 === 0.
 */
const bsnValid = (num: string): boolean => {
  if (!isdigits(num) || num.length !== 9) return false;
  if (Number.parseInt(num, 10) <= 0) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += (9 - i) * Number(num[i]);
  }
  sum -= Number(num[8]);
  return sum % 11 === 0;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Dutch VAT number must be 12 characters",
    );
  }
  if (!isdigits(v.slice(0, 9))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must start with 9 digits",
    );
  }
  if (v[9] !== "B") {
    return err(
      "INVALID_COMPONENT",
      "Dutch VAT number digit 10 must be B",
    );
  }
  if (!isdigits(v.slice(10, 12))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must end with 2 digits",
    );
  }
  if (Number.parseInt(v.slice(0, 9), 10) <= 0) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number first 9 digits must be > 0",
    );
  }
  if (Number.parseInt(v.slice(10, 12), 10) <= 0) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number last 2 digits must be > 0",
    );
  }
  // Valid if BSN check passes OR mod 97 check passes
  if (!bsnValid(v.slice(0, 9)) && mod97(`NL${v}`) !== 1) {
    return err(
      "INVALID_CHECKSUM",
      "Dutch VAT number checksum failed",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `NL${compact(value)}`;

/** Dutch VAT Number. */
const vat: Validator = {
  name: "Dutch VAT Number",
  localName: "BTW-identificatienummer",
  abbreviation: "BTW",
  aliases: [
    "BTW-nummer",
    "BTW-id",
  ] as const,
  candidatePattern: "NL\\d{9}B\\d{2}",
  country: "NL",
  entityType: "company",
  sourceUrl: "https://www.belastingdienst.nl/",
  examples: ["123456789B13"] as const,
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

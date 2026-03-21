/**
 * RUT (Registro Único Tributario).
 *
 * Uruguayan tax identification number issued by the
 * DGI (Dirección General Impositiva). The number is
 * 12 digits: 2-digit document type (01-22), 6-digit
 * sequence, fixed "001" suffix, and a check digit
 * computed via weighted sum mod 11 (Python-style
 * modulo of the negated sum).
 *
 * Format: ############  (12 digits compact)
 *
 * @see https://www.agesic.gub.uy/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import {
  randomDigits,
  randomInt,
} from "#util/generate";

const WEIGHTS = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

const compact = (value: string): string => {
  let v = clean(value, " -").trim();
  if (v.toUpperCase().startsWith("UY")) {
    v = v.slice(2);
  }
  return v;
};

/**
 * Python-style modulo: always returns a non-negative
 * result for a positive divisor.
 */
const pymod = (a: number, b: number): number =>
  ((a % b) + b) % b;

const calcCheckDigit = (
  value: string,
): string | null => {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += Number(value[i]) * WEIGHTS[i]!;
  }
  const result = pymod(-sum, 11);
  // A result of 10 means no valid single-digit check
  // digit exists; the DGI does not issue such numbers.
  if (result === 10) return null;
  return String(result);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "RUT must be 12 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "RUT must contain only digits",
    );
  }

  // First 2 digits: document type (01-22)
  const docType = Number.parseInt(v.slice(0, 2), 10);
  if (docType < 1 || docType > 22) {
    return err(
      "INVALID_COMPONENT",
      "RUT document type must be between 01 and 22",
    );
  }

  // Digits 2-8: sequence (must not be all zeros)
  if (v.slice(2, 8) === "000000") {
    return err(
      "INVALID_COMPONENT",
      "RUT sequence must not be all zeros",
    );
  }

  // Digits 8-11: must be "001"
  if (v.slice(8, 11) !== "001") {
    return err(
      "INVALID_COMPONENT",
      "RUT branch code must be 001",
    );
  }

  const expected = calcCheckDigit(v);
  if (expected === null || v.at(-1) !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "RUT check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}-${v.slice(2, 8)}-${v.slice(8, 11)}-${v.slice(11)}`;
};

/** Generate a random valid Uruguayan RUT. */
const generate = (): string => {
  for (;;) {
    const docType = String(randomInt(1, 22)).padStart(
      2,
      "0",
    );
    const seq = randomDigits(6);
    if (seq === "000000") continue;
    const partial = `${docType}${seq}001`;
    const check = calcCheckDigit(partial);
    if (check === null) continue;
    return `${partial}${check}`;
  }
};

/**
 * Uruguayan RUT (tax identification number).
 *
 * Examples sourced from python-stdnum test suite.
 */
const rut: Validator = {
  name: "Uruguayan Tax ID",
  localName: "Registro Único Tributario",
  abbreviation: "RUT",
  country: "UY",
  entityType: "any",
  lengths: [12] as const,
  examples: ["010100010013", "102000010017"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://www.agesic.gub.uy/",
  generate,
};

export default rut;
export { compact, format, validate, generate };

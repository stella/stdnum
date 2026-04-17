/**
 * RNC (Registro Nacional del Contribuyente) /
 * Cédula de Identidad.
 *
 * Dominican Republic tax identification number.
 * Companies use a 9-digit RNC with a check digit
 * computed via weighted sum mod 11. Individuals
 * use an 11-digit Cédula validated with the Luhn
 * algorithm.
 *
 * Format: #########   (9 digits, company RNC)
 *         ###########  (11 digits, individual Cédula)
 *
 * @see https://dgii.gov.do/
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Weights for the 9-digit RNC check digit.
 * Applied to positions 0-7; check digit is at
 * position 8.
 */
const RNC_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const;

const compact = (value: string): string =>
  clean(value, " -.").trim();

/**
 * RNC check digit: weighted sum mod 11, then
 * ((10 - remainder) % 9) + 1.
 */
const calcRncCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(value[i]) * RNC_WEIGHTS[i]!;
  }
  const remainder = sum % 11;
  return String(((10 - remainder) % 9) + 1);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 9 && v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Must be 9 digits (RNC) or 11 digits (Cédula)",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Must contain only digits",
    );
  }

  if (v.length === 9) {
    const expected = calcRncCheckDigit(v);
    if (v.at(-1) !== expected) {
      return err(
        "INVALID_CHECKSUM",
        "RNC check digit does not match",
      );
    }
  } else {
    // 11-digit Cédula uses Luhn checksum
    if (!luhnValidate(v)) {
      return err(
        "INVALID_CHECKSUM",
        "Cédula Luhn checksum does not match",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return `${v[0]}-${v.slice(1, 3)}-${v.slice(3, 8)}-${v.slice(8)}`;
  }
  return `${v.slice(0, 3)}-${v.slice(3, 10)}-${v.slice(10)}`;
};

/** Generate a random valid 9-digit RNC. */
const generate = (): string => {
  const payload = randomDigits(8);
  return payload + calcRncCheckDigit(payload);
};

/**
 * Dominican Republic RNC / Cédula.
 *
 * Examples sourced from python-stdnum test suite.
 */
const rnc: Validator = {
  name: "Dominican Republic Tax ID",
  localName: "Registro Nacional del Contribuyente",
  abbreviation: "RNC",
  aliases: [
    "RNC",
    "Registro Nacional del Contribuyente",
  ] as const,
  candidatePattern: "\\d{9}",
  country: "DO",
  entityType: "any",
  lengths: [9, 11] as const,
  examples: ["131098193", "00113918205"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://dgii.gov.do/",
  generate,
};

export default rnc;
export { compact, format, validate, generate };

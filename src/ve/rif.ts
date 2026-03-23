/**
 * RIF (Registro de Información Fiscal).
 *
 * Venezuelan tax identification number issued by the
 * SENIAT. The number consists of 1 letter indicating
 * the entity type (J=juridical, G=government,
 * V=natural/Venezuelan, E=foreign, P=passport)
 * followed by 8 digits and a check digit computed
 * via weighted sum mod 11.
 *
 * Format: X-########-# or X######### (10 chars compact)
 *
 * @see https://en.wikipedia.org/wiki/Tax_Identification_Number#Venezuela
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Map prefix letter to its numeric offset used
 * in the check digit computation.
 */
const PREFIX_VALUES: Record<string, number> = {
  V: 4,
  E: 8,
  J: 12,
  P: 16,
  G: 20,
};

/** Weights applied to the 8-digit body. */
const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2] as const;

/**
 * Lookup table for converting the mod 11 result
 * to the check character.
 */
const CHECK_LOOKUP = "00987654321";

const compact = (value: string): string =>
  clean(value, " -.").trim().toUpperCase();

const calcCheckDigit = (
  prefix: string,
  body: string,
): string => {
  const pv = PREFIX_VALUES[prefix]!;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(body[i]) * WEIGHTS[i]!;
  }
  const digit = (pv + (sum % 11)) % 11;
  return CHECK_LOOKUP[digit]!;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "RIF must be 10 characters",
    );
  }

  const prefix = v[0]!;
  if (!(prefix in PREFIX_VALUES)) {
    return err(
      "INVALID_COMPONENT",
      "RIF must start with V, E, J, P, or G",
    );
  }

  const body = v.slice(1, 9);
  const check = v.slice(9);
  if (!isdigits(v.slice(1))) {
    return err(
      "INVALID_FORMAT",
      "RIF body must contain only digits",
    );
  }

  const expected = calcCheckDigit(prefix, body);
  if (check !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "RIF check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v[0]}-${v.slice(1, 9)}-${v.slice(9)}`;
};

/** Generate a random valid Venezuelan RIF. */
const generate = (): string => {
  const types = ["V", "E", "J", "P", "G"] as const;
  const prefix = types[randomInt(0, types.length - 1)]!;
  const body = randomDigits(8);
  return (
    prefix + body + String(calcCheckDigit(prefix, body))
  );
};

/**
 * Venezuelan RIF (tax identification number).
 *
 * Examples sourced from python-stdnum test suite.
 */
const rif: Validator = {
  name: "Venezuelan Tax ID",
  localName: "Registro de Información Fiscal",
  abbreviation: "RIF",
  aliases: [
    "RIF",
    "Registro de Información Fiscal",
  ] as const,
  candidatePattern: "[VEJPG]-?\\d{8}-?\\d",
  country: "VE",
  entityType: "any",
  lengths: [10] as const,
  examples: ["V309876543", "J309876546"] as const,
  compact,
  format,
  validate,
  sourceUrl:
    "https://en.wikipedia.org/wiki/Tax_Identification_Number#Venezuela",
  generate,
};

export default rif;
export { compact, format, validate, generate };

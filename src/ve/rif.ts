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

import type { ValidateResult, Validator } from "../types";

import { clean } from "#util/clean";
import { randomDigits, randomPick } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

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
  const pv = PREFIX_VALUES[prefix] ?? 0;
  let sum = 0;
  for (const [i, weight] of WEIGHTS.entries()) {
    sum += Number(body[i]) * weight;
  }
  const digit = (pv + (sum % 11)) % 11;
  // SAFETY: digit ∈ [0, 10] and CHECK_LOOKUP has 11 chars.
  // eslint-disable-next-line no-non-null-assertion
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

  // SAFETY: length check above guarantees v[0] exists.
  // eslint-disable-next-line no-non-null-assertion
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

const GENERATE_TYPES = ["V", "E", "J", "P", "G"] as const;

/** Generate a random valid Venezuelan RIF. */
const generate = (): string => {
  const prefix = randomPick(GENERATE_TYPES);
  const body = randomDigits(8);
  return prefix + body + calcCheckDigit(prefix, body);
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

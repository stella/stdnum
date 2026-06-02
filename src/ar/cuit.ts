/**
 * CUIT (Clave Única de Identificación Tributaria).
 *
 * Argentine tax identification number assigned by AFIP
 * (Administración Federal de Ingresos Públicos). The
 * number consists of 11 digits: a 2-digit type code,
 * an 8-digit DNI number, and a single check digit
 * computed using a weighted modulo 11 algorithm.
 *
 * Type codes: 20/23/24/27 = person, 30/33/34 = company,
 * 50/51/55 = international.
 *
 * Format: XX-XXXXXXXX-X (11 digits).
 *
 * @see https://www.afip.gob.ar/
 * @see https://en.wikipedia.org/wiki/CUIT_(Argentina)
 */

import type { ValidateResult, Validator } from "../types";

import { clean } from "#util/clean";
import { randomDigits, randomPick } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const VALID_TYPES = new Set([
  "20",
  "23",
  "24",
  "27",
  "30",
  "33",
  "34",
  "50",
  "51",
  "55",
]);

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

const GENERATE_TYPES = [
  "20",
  "23",
  "24",
  "27",
  "30",
  "33",
  "34",
] as const;

const compact = (value: string): string =>
  clean(value, " -.").trim();

/**
 * Compute the CUIT check digit using weighted sum
 * mod 11. Weights: [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].
 *
 * check = 11 - (sum % 11); if 11 -> 0, if 10 -> 9.
 */
const calcCheckDigit = (body: string): number => {
  let sum = 0;
  for (const [i, weight] of WEIGHTS.entries()) {
    sum += Number(body[i]) * weight;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return 0;
  if (remainder === 10) return 9;
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 11) {
    return err("INVALID_LENGTH", "CUIT must be 11 digits");
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CUIT must contain only digits",
    );
  }

  const typeCode = v.slice(0, 2);
  if (!VALID_TYPES.has(typeCode)) {
    return err(
      "INVALID_COMPONENT",
      "CUIT has an invalid type code",
    );
  }

  const expected = calcCheckDigit(v.slice(0, 10));
  if (Number(v[10]) !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "CUIT check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}-${v.slice(2, 10)}-${v.slice(10)}`;
};

/** Generate a random valid CUIT. */
const generate = (): string => {
  const type = randomPick(GENERATE_TYPES);
  const body = type + randomDigits(8);
  const check = calcCheckDigit(body);
  return body + String(check);
};

/**
 * Argentine CUIT (tax identification number).
 *
 * Examples sourced from python-stdnum test suite
 * (ar.cuit module).
 */
const cuit: Validator = {
  name: "Argentine Tax ID",
  localName: "Clave Única de Identificación Tributaria",
  abbreviation: "CUIT",
  aliases: [
    "CUIT",
    "CUIL",
    "Clave Única de Identificación Tributaria",
  ] as const,
  candidatePattern: "\\d{2}-?\\d{8}-?\\d",
  country: "AR",
  entityType: "any",
  compact,
  format,
  validate,
  sourceUrl: "https://www.afip.gob.ar/",
  lengths: [11] as const,
  examples: ["20267565393", "20055361682"] as const,
  generate,
};

export default cuit;
export { compact, format, validate, generate };

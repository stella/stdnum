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

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const VALID_TYPES = new Set([
  "20", "23", "24", "27",
  "30", "33", "34",
  "50", "51", "55",
]);

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

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
  for (let i = 0; i < 10; i++) {
    sum += Number(body[i]) * WEIGHTS[i]!;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return 0;
  if (remainder === 10) return 9;
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "CUIT must be 11 digits",
    );
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

/**
 * Argentine CUIT (tax identification number).
 *
 * Examples sourced from python-stdnum test suite
 * (ar.cuit module).
 */
const cuit: Validator = {
  name: "Argentine Tax ID",
  localName:
    "Clave Única de Identificación Tributaria",
  abbreviation: "CUIT",
  country: "AR",
  entityType: "any",
  compact,
  format,
  validate,
  sourceUrl: "https://www.afip.gob.ar/",
  lengths: [11] as const,
  examples: ["20267565393", "20055361682"] as const,
};

export default cuit;
export { compact, format, validate };

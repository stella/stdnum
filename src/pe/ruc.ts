/**
 * RUC (Registro Único de Contribuyentes).
 *
 * Peruvian tax identification number assigned by SUNAT
 * (Superintendencia Nacional de Aduanas y de
 * Administración Tributaria). The number consists of
 * 11 digits: a type prefix (10 = person, 20 = company,
 * among others), 8 identification digits, and a check
 * digit computed using a weighted modulo 11 algorithm.
 *
 * Format: XXXXXXXXXXX (11 digits, no separators).
 *
 * @see https://www.sunat.gob.pe/
 * @see https://en.wikipedia.org/wiki/Tax_identification_number#Peru
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

/**
 * Valid type prefixes for RUC numbers.
 * 10 = natural person, 15 = non-domiciled without RUC,
 * 17 = non-domiciled, 20 = legal entity,
 * others for specific entity types.
 */
const VALID_PREFIXES = new Set([
  "10", "15", "17", "20",
]);

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

const compact = (value: string): string =>
  clean(value, " -.").trim();

/**
 * Compute the RUC check digit using weighted sum
 * mod 11. Weights: [5, 4, 3, 2, 7, 6, 5, 4, 3, 2].
 *
 * check = 11 - (sum % 11); if >= 10, subtract 10.
 */
const calcCheckDigit = (body: string): number => {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(body[i]) * WEIGHTS[i]!;
  }
  const remainder = 11 - (sum % 11);
  if (remainder >= 10) return remainder - 10;
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "RUC must be 11 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "RUC must contain only digits",
    );
  }

  const prefix = v.slice(0, 2);
  if (!VALID_PREFIXES.has(prefix)) {
    return err(
      "INVALID_COMPONENT",
      "RUC has an invalid type prefix",
    );
  }

  const expected = calcCheckDigit(v.slice(0, 10));
  if (Number(v[10]) !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "RUC check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Peruvian RUC. */
const generate = (): string => {
  const prefixes = ["10", "15", "17", "20"] as const;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]!;
  const body = prefix + randomDigits(8);
  return body + String(calcCheckDigit(body));
};

/**
 * Peruvian RUC (tax identification number).
 *
 * Examples sourced from python-stdnum test suite
 * (pe.ruc module).
 */
const ruc: Validator = {
  name: "Peruvian Tax ID",
  localName: "Registro Único de Contribuyentes",
  abbreviation: "RUC",
  country: "PE",
  entityType: "any",
  compact,
  format,
  validate,
  sourceUrl: "https://www.sunat.gob.pe/",
  lengths: [11] as const,
  examples: ["20131312955", "20100047218"] as const,
  generate,
};

export default ruc;
export { compact, format, validate, generate };

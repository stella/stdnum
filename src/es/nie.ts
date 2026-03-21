/**
 * NIE (Número de Identidad de Extranjero).
 *
 * Spanish foreigner identification number. Starts
 * with X, Y, or Z, followed by 7 digits and a check
 * letter computed using the DNI algorithm.
 *
 * @see https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/nie/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { CHECK_LETTERS } from "./dni";
import { randomDigits, randomInt } from "#util/generate";

const PREFIX_MAP: Record<string, string> = {
  X: "0",
  Y: "1",
  Z: "2",
};

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "NIE must be 9 characters",
    );
  }

  const prefix = v[0];
  const replacement = PREFIX_MAP[prefix];
  if (replacement === undefined) {
    return err(
      "INVALID_FORMAT",
      "NIE must start with X, Y, or Z",
    );
  }

  const digits = v.slice(1, 8);
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "NIE must have 7 digits after prefix",
    );
  }

  const letter = v[8];
  const num = Number(replacement + digits);
  const expected = CHECK_LETTERS[num % 23];
  if (letter !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "NIE check letter does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Spanish NIE. */
const generate = (): string => {
  const prefixes = ["X", "Y", "Z"] as const;
  const vals: Record<string, number> = { X: 0, Y: 1, Z: 2 };
  const prefix = prefixes[randomInt(0, 2)]!;
  const digits = randomDigits(7);
  const num = vals[prefix]! * 10000000 + Number(digits);
  return prefix + digits + CHECK_LETTERS[num % 23];
};

/** Spanish Foreigner Identification Number. */
const nie: Validator = {
  name: "Spanish Foreigner ID",
  localName: "Número de Identidad de Extranjero",
  abbreviation: "NIE",
  country: "ES",
  entityType: "person",
  sourceUrl: 
    "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/nie/",
  examples: ["X5253868R"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nie;
export { compact, format, validate, generate };

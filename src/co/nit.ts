/**
 * NIT (Número de Identificación Tributaria).
 *
 * Colombian tax identification number, also known as
 * RUT (Registro Unico Tributario). The last digit is
 * a check digit computed via a weighted sum mod 11
 * with weights [3,7,13,17,19,23,29,37,41,43,47,53,
 * 59,67,71] applied right-to-left.
 *
 * @see https://es.wikipedia.org/wiki/Número_de_identificación_tributaria
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [
  3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59,
  67, 71,
] as const;

/** Lookup table: remainder -> check digit. */
const CHECK_DIGITS = [0, 1, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const compact = (value: string): string =>
  clean(value, " -.,");

const calcCheckDigit = (body: string): number => {
  let sum = 0;
  const len = body.length;
  for (let i = 0; i < len; i++) {
    sum += Number(body[len - 1 - i]) * WEIGHTS[i]!;
  }
  return CHECK_DIGITS[sum % 11]!;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 8 || v.length > 16) {
    return err(
      "INVALID_LENGTH",
      "NIT must be between 8 and 16 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NIT must contain only digits",
    );
  }

  const body = v.slice(0, -1);
  const check = calcCheckDigit(body);
  if (check !== Number(v[v.length - 1])) {
    return err(
      "INVALID_CHECKSUM",
      "NIT check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const body = v.slice(0, -1);
  const checkChar = v.slice(-1);
  const groups: string[] = [];
  for (
    let i = body.length;
    i > 0;
    i -= 3
  ) {
    groups.unshift(body.slice(Math.max(0, i - 3), i));
  }
  return `${groups.join(".")}-${checkChar}`;
};

/** Generate a random valid NIT (10 digits). */
const generate = (): string => {
  const body = randomDigits(9);
  const check = calcCheckDigit(body);
  return `${body}${check}`;
};

/** Colombian tax identification number. */
const nit: Validator = {
  name: "Número de Identificación Tributaria",
  localName: "Número de Identificación Tributaria",
  abbreviation: "NIT",
  country: "CO",
  entityType: "any",
  description:
    "Tax identifier issued by the DIAN",
  sourceUrl:
    "https://es.wikipedia.org/wiki/N%C3%BAmero_de_identificaci%C3%B3n_tributaria",
  lengths: [8, 9, 10, 11, 12, 13, 14, 15, 16] as const,
  examples: ["2131234321", "8001234565"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nit;
export { compact, format, generate, validate };

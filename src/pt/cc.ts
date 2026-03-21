/**
 * CC (Cartão de Cidadão, Portuguese Identity number).
 *
 * Alphanumeric: numeric civil ID + 2-letter version +
 * 1 check digit. Validated with a Luhn-like algorithm
 * over an alphanumeric alphabet (0-9, A-Z = 0-35).
 *
 * @see https://pt.wikipedia.org/wiki/Cartão_de_cidadão
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const CC_RE = /^\d{9}[A-Z0-9]{2}\d$/;

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const compact = (value: string): string =>
  clean(value, " ").toUpperCase();

const calcCheckDigit = (value: string): string => {
  let sum = 0;
  for (let i = value.length - 1; i >= 0; i--) {
    const pos = value.length - 1 - i;
    let n = ALPHABET.indexOf(value[i]!);
    if (pos % 2 === 0) {
      n *= 2;
      if (n > 9) n = Math.floor(n / 10) + (n % 10);
    }
    sum += n;
  }
  return String((10 - (sum % 10)) % 10);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "CC must be 12 characters",
    );
  }

  if (!CC_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "CC must be 9 digits, 2 alphanumeric version characters, and a check digit",
    );
  }

  if (calcCheckDigit(v.slice(0, -1)) !== v.at(-1)) {
    return err(
      "INVALID_CHECKSUM",
      "CC check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, -3)} ${v.slice(-3, -1)} ${v.at(-1)}`;
};

/** Portuguese Identity Card number. */
const cc: Validator = {
  name: "Portuguese Identity Card",
  localName: "Cartão de Cidadão",
  abbreviation: "CC",
  country: "PT",
  entityType: "person",
  description:
    "Alphanumeric national identity card number with Luhn-like check digit",
  sourceUrl:
    "https://pt.wikipedia.org/wiki/Cartão_de_cidadão",
  lengths: [12] as const,
  examples: ["000000000ZZ8"] as const,
  compact,
  format,
  validate,
};

export default cc;
export { compact, format, validate };

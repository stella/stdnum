/**
 * CNPJ (Cadastro Nacional da Pessoa Jurídica).
 *
 * Brazilian company tax identification number assigned by
 * the Receita Federal (Federal Revenue Service). The
 * number consists of 14 characters: 8 identifying the
 * company, 4 identifying the establishment (0001 for
 * headquarters), and 2 check digits computed using a
 * weighted modulo 11 algorithm.
 *
 * As of July 2026 the Receita Federal will begin issuing
 * alphanumeric CNPJs (letters A-Z in place of some
 * digits). The check digit algorithm uses ordinal values
 * (0-9 = 0-9, A-Z = 17-42) to support this.
 *
 * Format: NN.NNN.NNN/NNNN-DD (14 characters).
 *
 * @see https://www.gov.br/en/categories/finance-taxes-and-public-management/cpf-cnpj-and-other-records
 * @see https://en.wikipedia.org/wiki/CNPJ
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const CNPJ_RE = /^[\dA-Z]+$/;

const compact = (value: string): string =>
  clean(value, " -./").trim().toUpperCase();

/**
 * Convert a CNPJ character to its numeric value.
 * Digits 0-9 map to 0-9; letters A-Z map to their
 * char code minus 48 (matching python-stdnum's
 * `ord(n) - 48` convention: A=17, B=18, ..., Z=42).
 */
const charToValue = (ch: string): number =>
  ch.charCodeAt(0) - 48;

/**
 * Calculate the two CNPJ check digits using the
 * Receita Federal modulo 11 algorithm.
 *
 * First check digit: weights [5,4,3,2,9,8,7,6,5,4,3,2]
 * applied to the first 12 characters.
 *
 * Second check digit: weights [6,5,4,3,2,9,8,7,6,5,4,3,2]
 * applied to the first 12 characters plus the first
 * check digit.
 */
const calcCheckDigits = (number: string): string => {
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += w1[i] * charToValue(number[i]);
  }
  const d1 = ((11 - (sum % 11)) % 11) % 10;

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += w2[i] * charToValue(number[i]);
  }
  // Use the computed d1 (not the stored digit at
  // number[12]) so both check digits are derived
  // from the base alone.
  sum += w2[12] * d1;
  const d2 = ((11 - (sum % 11)) % 11) % 10;

  return `${d1}${d2}`;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 14) {
    return err(
      "INVALID_LENGTH",
      "CNPJ must be 14 characters",
    );
  }
  if (!CNPJ_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "CNPJ must contain only digits and uppercase letters",
    );
  }
  // Reject all-zero base (first 12 chars).
  // Unlike CPF, we do not reject all-same-digit CNPJs;
  // python-stdnum only blocks the all-zero base, and
  // there is no official Receita Federal list of
  // blocked same-digit CNPJ sequences.
  if (v.startsWith("000000000000")) {
    return err(
      "INVALID_FORMAT",
      "CNPJ base must not be all zeros",
    );
  }
  if (calcCheckDigits(v) !== v.slice(12)) {
    return err(
      "INVALID_CHECKSUM",
      "CNPJ check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
};

/**
 * Brazilian CNPJ (company tax ID).
 *
 * Examples sourced from publicly available Brazilian
 * corporate registries:
 * - Petrobras: 33.000.167/0001-01
 * - Banco do Brasil: 00.000.000/0001-91
 */
const cnpj: Validator = {
  name: "Brazilian CNPJ",
  localName: "Cadastro Nacional da Pessoa Jurídica",
  abbreviation: "CNPJ",
  country: "BR",
  entityType: "company",
  sourceUrl: "https://www.gov.br/receitafederal/",
  examples: ["33000167000101", "00000000000191"] as const,
  compact,
  format,
  validate,
};

export default cnpj;
export { compact, format, validate };

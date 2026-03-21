/**
 * CPF (Cadastro de Pessoas Físicas).
 *
 * Brazilian personal tax identification number assigned
 * by the Receita Federal (Federal Revenue Service) to
 * individuals. The number consists of 11 digits: 9 base
 * digits followed by 2 check digits computed using a
 * weighted modulo 11 algorithm.
 *
 * Format: NNN.NNN.NNN-DD (11 digits, purely numeric).
 *
 * @see https://www.gov.br/en/categories/finance-taxes-and-public-management/cpf-cnpj-and-other-records
 * @see https://en.wikipedia.org/wiki/CPF_number
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -.").trim();

/**
 * Calculate the two CPF check digits using the
 * Receita Federal modulo 11 algorithm.
 *
 * First check digit: multiply digits 0..8 by weights
 * 10..2, sum, then (11 - sum % 11) % 11 % 10.
 *
 * Second check digit: multiply digits 0..8 by weights
 * 11..3, add 2 * first check digit, then
 * (11 - sum % 11) % 11 % 10.
 */
const calcCheckDigits = (number: string): string => {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (10 - i) * Number(number[i]);
  }
  const d1 = ((11 - (sum % 11)) % 11) % 10;

  sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (11 - i) * Number(number[i]);
  }
  sum += 2 * d1;
  const d2 = ((11 - (sum % 11)) % 11) % 10;

  return `${d1}${d2}`;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err("INVALID_LENGTH", "CPF must be 11 digits");
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CPF must contain only digits",
    );
  }
  // All-same-digit CPFs (e.g. 000.000.000-00) pass the
  // checksum but are not valid registrations.
  if (/^(\d)\1{10}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "CPF must not be a repeated digit sequence",
    );
  }
  if (calcCheckDigits(v) !== v.slice(9)) {
    return err(
      "INVALID_CHECKSUM",
      "CPF check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
};

/** Brazilian CPF (personal tax ID). */
const cpf: Validator = {
  name: "Brazilian CPF",
  localName: "Cadastro de Pessoas Físicas",
  abbreviation: "CPF",
  country: "BR",
  entityType: "person",
  sourceUrl: "https://www.gov.br/receitafederal/",
  examples: ["39053344705"] as const,
  compact,
  format,
  validate,
};

export default cpf;
export { compact, format, validate };

/** Generate a random valid Costa Rican CPF. */
const generate = (): string => {
  const province = String(randomInt(1, 9));
  const volume = randomDigits(4);
  const entry = randomDigits(4);
  return `0${province}${volume}${entry}`;
};

/**
 * CPF (Cédula de Persona Física, Costa Rican
 * physical person ID number).
 *
 * 10 digits: 0P-TTTT-AAAA where:
 *   - 0 = fixed leading zero
 *   - P = province digit
 *   - TTTT = volume (tomo), zero-padded
 *   - AAAA = entry (asiento), zero-padded
 *
 * No check digit; validation is by format only.
 *
 * Ported from python-stdnum cr.cpf module.
 *
 * @see https://www.tse.go.cr/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { randomDigits, randomInt } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

/**
 * Compact: strip spaces, pad hyphen-separated parts
 * (2-4-4), join, and prepend '0' if 9 digits.
 */
const compact = (value: string): string => {
  let number = clean(value, " ").trim().toUpperCase();

  const parts = number.split("-");
  if (parts.length === 3) {
    const p0 = parts[0]!.padStart(2, "0");
    const p1 = parts[1]!.padStart(4, "0");
    const p2 = parts[2]!.padStart(4, "0");
    number = p0 + p1 + p2;
  } else {
    number = number.replaceAll("-", "");
  }

  if (number.length === 9) {
    number = "0" + number;
  }

  return number;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Costa Rican CPF must be 10 digits",
    );
  }

  if (!/^\d{10}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Costa Rican CPF must contain only digits",
    );
  }

  if (v[0] !== "0") {
    return err(
      "INVALID_COMPONENT",
      "Costa Rican CPF must start with 0",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}-${v.slice(2, 6)}-${v.slice(6, 10)}`;
};

/**
 * Costa Rican physical person ID number (CPF).
 *
 * Examples sourced from python-stdnum test suite.
 */
const cpf: Validator = {
  name: "Costa Rican Physical Person ID",
  localName: "Cédula de Persona Física",
  abbreviation: "CPF",
  aliases: [
    "CPF",
    "cédula de persona física",
  ] as const,
  candidatePattern: "\\d{9,12}",
  country: "CR",
  entityType: "person",
  lengths: [10] as const,
  examples: ["0304550175", "0109130259"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://www.tse.go.cr/",
  generate,
};

export default cpf;
export { compact, format, validate, generate };

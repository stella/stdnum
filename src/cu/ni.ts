/**
 * NI (Número de Identidad, Cuban identity card number).
 *
 * 11 digits encoding birth date, century, sequence, and
 * gender. Structure: YYMMDDXNNNN where:
 *   - YYMMDD = birth date
 *   - X = century digit (9=1800s, 0-5=1900s, 6-8=2000s)
 *   - NNNN = sequence (digit at position 9 encodes gender:
 *     even=male, odd=female)
 *
 * No check digit; validation is by date and format only.
 *
 * Ported from python-stdnum cu.ni module.
 *
 * @see https://www.ecured.cu/Carnet_de_Identidad
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " -").trim();

/**
 * Derive the full birth year from the two-digit year
 * and the century indicator at position 6.
 */
const centuryOffset = (digit: string): number => {
  if (digit === "9") return 1800;
  if (digit >= "0" && digit <= "5") return 1900;
  return 2000;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Cuban NI must be 11 digits",
    );
  }

  if (!/^\d{11}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Cuban NI must contain only digits",
    );
  }

  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const year = centuryOffset(v[6]!) + yy;

  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "Cuban NI contains an invalid birth date",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from a Cuban NI.
 * Returns null if the value is not valid.
 */
const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const year = centuryOffset(v[6]!) + yy;

  const genderDigit = Number(v[9]);
  const gender: "male" | "female" =
    genderDigit % 2 === 0 ? "male" : "female";

  return {
    birthDate: new Date(year, mm - 1, dd),
    gender,
  };
};

/**
 * Cuban identity card number (NI).
 *
 * Examples sourced from python-stdnum test suite.
 */
const ni: Validator = {
  name: "Cuban Identity Card Number",
  localName: "Número de Identidad",
  abbreviation: "NI",
  aliases: [
    "NI",
    "número de identidad",
    "carnet de identidad",
  ] as const,
  candidatePattern: "\\d{11}",
  country: "CU",
  entityType: "person",
  lengths: [11] as const,
  examples: ["91021027775", "72062506561"] as const,
  compact,
  format,
  validate,
  sourceUrl: "https://www.ecured.cu/Carnet_de_Identidad",
};

export default ni;
export { compact, format, parse, validate };

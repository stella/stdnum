/**
 * RFC (Registro Federal de Contribuyentes).
 *
 * Mexican tax identification number issued by the SAT
 * (Servicio de Administración Tributaria). The number is
 * 13 characters for individuals (4 letters + 6 digits
 * YYMMDD + 3 alphanumeric) or 12 characters for
 * companies (3 letters + 6 digits YYMMDD + 3
 * alphanumeric). The last character is a check digit
 * computed with a mod 11 algorithm over a specific
 * alphabet mapping.
 *
 * Format: AAAA######XXX (persons, 13 chars)
 *         AAA######XXX  (companies, 12 chars)
 *
 * @see https://en.wikipedia.org/wiki/Tax_Identification_Number_(Mexico)
 */

import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

/** Alphabet for RFC check digit computation. */
const ALPHABET =
  "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

const CHAR_MAP = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) {
  CHAR_MAP.set(ALPHABET[i]!, i);
}

const compact = (value: string): string =>
  clean(value, " -.").trim().toUpperCase();

/**
 * Compute the RFC check digit using mod 11 with
 * the SAT alphabet mapping.
 *
 * Each character is mapped to its position in the
 * ALPHABET, then multiplied by a weight that starts
 * at (len + 1) and decreases by 1. The check digit
 * is (11 - sum % 11) % 11, mapped to 0-9 or "A".
 */
const calcCheckDigit = (value: string): string => {
  // Pad 12-char company RFCs with a leading space
  // to align weights with the 13-char algorithm.
  const padded = value.length === 11 ? ` ${value}` : value;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const ch = padded[i]!;
    const v = CHAR_MAP.get(ch) ?? 0;
    sum += v * (13 - i);
  }
  const remainder = sum % 11;
  if (remainder === 0) return "0";
  const digit = 11 - remainder;
  return digit === 10 ? "A" : String(digit);
};

const PERSON_RE = /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;
const COMPANY_RE = /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/;

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 12 && v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "RFC must be 12 or 13 characters",
    );
  }

  const isPerson = v.length === 13;
  const re = isPerson ? PERSON_RE : COMPANY_RE;
  if (!re.test(v)) {
    return err(
      "INVALID_FORMAT",
      "RFC has an invalid format",
    );
  }

  // Validate the embedded date (YYMMDD).
  const dateOffset = isPerson ? 4 : 3;
  const yy = Number(v.slice(dateOffset, dateOffset + 2));
  const mm = Number(
    v.slice(dateOffset + 2, dateOffset + 4),
  );
  const dd = Number(
    v.slice(dateOffset + 4, dateOffset + 6),
  );

  // RFC dates use 2-digit years; use 2000 century for
  // date validation (any valid calendar date is accepted).
  const year = 2000 + yy;
  if (!isValidDate(year, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "RFC contains an invalid date",
    );
  }

  // Verify check digit (last character).
  const body = v.slice(0, -1);
  const expected = calcCheckDigit(body);
  if (v.at(-1) !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "RFC check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Mexican RFC (tax identification number).
 *
 * Examples sourced from python-stdnum test suite.
 */
const rfc: Validator = {
  name: "Mexican Tax ID",
  localName: "Registro Federal de Contribuyentes",
  abbreviation: "RFC",
  country: "MX",
  entityType: "any",
  lengths: [12, 13] as const,
  examples: ["GODE561231GR8", "MAB9307148T4"] as const,
  compact,
  format,
  validate,
  sourceUrl:
    "https://en.wikipedia.org/wiki/Tax_Identification_Number_(Mexico)",
};

export default rfc;
export { compact, format, validate };

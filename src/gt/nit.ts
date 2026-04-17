/**
 * NIT (Número de Identificación Tributaria,
 * Guatemala tax number).
 *
 * 2–12 characters: body digits followed by a check
 * character. The check character is computed via a
 * weighted sum mod 11; remainder 10 maps to 'K'.
 *
 * Ported from python-stdnum gt.nit module.
 *
 * @see https://portal.sat.gob.gt/portal/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Compact: strip spaces, hyphens, leading zeros,
 * and uppercase.
 */
const compact = (value: string): string => {
  const v = clean(value, " -").trim().toUpperCase();
  return v.replace(/^0+/, "");
};

/**
 * Calculate the check character for a body string.
 * Weighted sum mod 11; remainder 10 yields 'K'.
 */
const calcCheckChar = (body: string): string => {
  let sum = 0;
  const len = body.length;
  for (let i = 0; i < len; i++) {
    sum += (len - i + 1) * Number(body[i]);
  }
  const remainder = ((-sum % 11) + 11) % 11;
  return remainder === 10 ? "K" : String(remainder);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length < 2 || v.length > 12) {
    return err(
      "INVALID_LENGTH",
      "Guatemala NIT must be 2–12 characters",
    );
  }

  const body = v.slice(0, -1);
  const check = v.slice(-1);

  if (!isdigits(body)) {
    return err(
      "INVALID_FORMAT",
      "Guatemala NIT body must contain only digits",
    );
  }

  if (check !== "K" && !/^\d$/.test(check)) {
    return err(
      "INVALID_FORMAT",
      "Guatemala NIT check character must be a digit or K",
    );
  }

  if (check !== calcCheckChar(body)) {
    return err(
      "INVALID_CHECKSUM",
      "Guatemala NIT check character does not match",
    );
  }

  return { valid: true, compact: v };
};

/**
 * Format: insert a hyphen before the check character.
 */
const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, -1)}-${v.slice(-1)}`;
};

/** Generate a random valid NIT (7 body digits). */
const generate = (): string => {
  for (;;) {
    const body = randomDigits(7);
    if (body.startsWith("0")) continue;
    const check = calcCheckChar(body);
    return `${body}${check}`;
  }
};

/** Guatemala tax identification number. */
const nit: Validator = {
  name: "Tax Identification Number",
  localName: "Número de Identificación Tributaria",
  abbreviation: "NIT",
  aliases: ["NIT"] as const,
  candidatePattern: "\\d{7,8}-?\\d",
  country: "GT",
  entityType: "any",
  description: "Tax identifier issued by Guatemala's SAT",
  sourceUrl: "https://portal.sat.gob.gt/portal/",
  lengths: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const,
  examples: ["576937K", "39525503", "71080"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nit;
export { compact, format, generate, validate };

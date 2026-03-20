/**
 * RUT (Rol Único Tributario).
 *
 * Chilean tax identification number assigned by the SII
 * (Servicio de Impuestos Internos). The number consists
 * of 7 or 8 digits followed by a check digit (0-9 or K),
 * computed using a modulo 11 algorithm with weights
 * [2, 3, 4, 5, 6, 7] cycling right-to-left.
 *
 * Format: XX.XXX.XXX-C (7-8 digits + check digit).
 *
 * @see https://www.sii.cl/
 * @see https://en.wikipedia.org/wiki/Rol_%C3%9Anico_Tributario
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const RUT_RE = /^\d{7,8}[\dK]$/;

const compact = (value: string): string => {
  let v = clean(value, " -.").trim().toUpperCase();
  if (v.startsWith("CL")) v = v.slice(2);
  return v;
};

/**
 * Compute the RUT check digit using mod 11 with
 * weights [2, 3, 4, 5, 6, 7] cycling right-to-left.
 *
 * remainder = 11 - (weighted sum % 11)
 * 11 -> "0", 10 -> "K", else the digit as string.
 */
const calcCheckDigit = (body: string): string => {
  const weights = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = body.length - 1, w = 0; i >= 0; i--, w++) {
    sum += Number(body[i]) * weights[w % 6]!;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "RUT must be 8 or 9 characters",
    );
  }

  if (!RUT_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "RUT must contain only digits and optionally K",
    );
  }

  const body = v.slice(0, -1);
  const expected = calcCheckDigit(body);
  if (v.at(-1) !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "RUT check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const check = v.at(-1);
  const body = v.slice(0, -1);
  return (
    `${body.slice(0, -6)}.${body.slice(-6, -3)}` +
    `.${body.slice(-3)}-${check}`
  );
};

/**
 * Chilean RUT (tax identification number).
 *
 * Examples sourced from python-stdnum test suite
 * (cl.rut module).
 */
const rut: Validator = {
  name: "Chilean Tax ID",
  localName: "Rol Único Tributario",
  abbreviation: "RUT",
  country: "CL",
  entityType: "any",
  compact,
  format,
  validate,
  sourceUrl: "https://www.sii.cl/",
  lengths: [8, 9] as const,
  examples: ["760864285", "125319092"] as const,
};

export default rut;
export { compact, format, validate };

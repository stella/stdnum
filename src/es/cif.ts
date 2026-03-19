/**
 * CIF (Código de Identificación Fiscal).
 *
 * Spanish company tax identification number.
 * Letter prefix (ABCDEFGHJNPQRSUVW) + 7 digits +
 * check digit or letter. Delegates to the CIF
 * branch of es/vat validation.
 *
 * @see https://www.agenciatributaria.es/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const CIF_PREFIXES = "ABCDEFGHJNPQRSUVW";
const CIF_LETTERS = "JABCDEFGHI";

const cifChecksum = (digits: string): number => {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    if (i % 2 === 0) {
      const doubled = d * 2;
      odd += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      even += d;
    }
  }
  return (10 - ((even + odd) % 10)) % 10;
};

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("ES") || v.startsWith("es")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Spanish CIF must be 9 characters",
    );
  }

  const first = v[0];
  if (!CIF_PREFIXES.includes(first)) {
    return err(
      "INVALID_FORMAT",
      "Spanish CIF must start with a valid prefix letter",
    );
  }

  if (!isdigits(v.slice(1, 8))) {
    return err(
      "INVALID_FORMAT",
      "Spanish CIF must have 7 digits after prefix",
    );
  }

  const last = v[8];
  const check = cifChecksum(v.slice(1, 8));

  if (
    last !== String(check) &&
    last !== CIF_LETTERS[check]
  ) {
    return err(
      "INVALID_CHECKSUM",
      "Spanish CIF check digit/letter mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Spanish Company Tax ID (CIF). */
const cif: Validator = {
  name: "Spanish Company Tax ID",
  localName: "Código de Identificación Fiscal",
  abbreviation: "CIF",
  country: "ES",
  entityType: "company",
  examples: ["A13585625"] as const,
  compact,
  format,
  validate,
};

export default cif;
export { compact, format, validate };

/**
 * LEI (Legal Entity Identifier).
 *
 * ISO 17442. 20-character alphanumeric code
 * identifying legal entities in financial
 * transactions. Validated using ISO 7064
 * Mod 97-10 (same as IBAN).
 *
 * @see https://www.gleif.org/
 */

import { mod97 } from "#checksums/mod97";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { charValue, isalnum } from "#util/strings";

import type { ValidateResult, Validator } from "./types";
import { randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 20) {
    return err(
      "INVALID_LENGTH",
      "LEI must be exactly 20 characters",
    );
  }
  if (!isalnum(v)) {
    return err(
      "INVALID_FORMAT",
      "LEI must contain only letters and digits",
    );
  }
  // Characters 5-18 must be alphanumeric (entity)
  // Characters 19-20 are check digits (numeric)
  const checkPart = v.slice(18);
  if (!/^\d{2}$/.test(checkPart)) {
    return err(
      "INVALID_FORMAT",
      "LEI check digits must be numeric",
    );
  }
  // Convert to numeric and validate mod 97
  let numeric = "";
  for (let i = 0; i < v.length; i++) {
    const ch = v[i];
    if (ch !== undefined) {
      numeric += String(charValue(ch));
    }
  }
  if (mod97(numeric) !== 1) {
    return err(
      "INVALID_CHECKSUM",
      "LEI check digits are incorrect",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 4)} ${v.slice(4, 8)} ${v.slice(8, 12)} ${v.slice(12, 16)} ${v.slice(16)}`;
};

/** Generate a random valid LEI. */
const generate = (): string => {
  for (;;) {
    let base = "";
    for (let i = 0; i < 18; i++) base += String(randomInt(0, 9));
    for (let cd = 0; cd < 100; cd++) {
      const c = base + String(cd).padStart(2, "0");
      if (validate(c).valid) return c;
    }
  }
};

/** Legal Entity Identifier. */
const lei: Validator = {
  name: "Legal Entity Identifier",
  localName: "Legal Entity Identifier",
  abbreviation: "LEI",
  entityType: "company",
  sourceUrl: "https://www.gleif.org/",
  examples: ["5493006MHB84DD0ZWV18"] as const,
  compact,
  format,
  validate,
  generate,
};

export default lei;
export { compact, format, validate, generate };

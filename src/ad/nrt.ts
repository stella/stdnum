/**
 * NRT (Número de Registre Tributari, Andorra tax number).
 *
 * The NRT identifies legal and natural entities for tax
 * purposes. It consists of one letter indicating entity
 * type, six digits, and a check letter.
 *
 * Entity type prefixes:
 *   F      — companies (digits <= 699999)
 *   A, L   — other entities (digits 700000-799999)
 *   C, D, E, G, O, P, U — other types
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Andorra-TIN.pdf
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const VALID_PREFIXES = "ACDEFGLOPU";

const compact = (value: string): string =>
  clean(value, " -.").toUpperCase().trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Andorra NRT must be 8 characters",
    );
  }
  const prefix = v[0]!;
  const tail = v[7]!;
  const digits = v.slice(1, 7);
  if (!/^[A-Z]$/.test(prefix) || !/^[A-Z]$/.test(tail)) {
    return err(
      "INVALID_FORMAT",
      "Andorra NRT must start and end with a letter",
    );
  }
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Andorra NRT must have 6 digits in the middle",
    );
  }
  if (!VALID_PREFIXES.includes(prefix)) {
    return err(
      "INVALID_COMPONENT",
      "Andorra NRT has an invalid entity type prefix",
    );
  }
  if (prefix === "F" && digits > "699999") {
    return err(
      "INVALID_COMPONENT",
      "Andorra NRT F-type digits must be <= 699999",
    );
  }
  if (
    (prefix === "A" || prefix === "L") &&
    !("699999" < digits && digits < "800000")
  ) {
    return err(
      "INVALID_COMPONENT",
      "Andorra NRT A/L-type digits must be 700000-799999",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v[0]}-${v.slice(1, 7)}-${v[7]}`;
};

/** Andorra NRT (Número de Registre Tributari). */
const nrt: Validator = {
  name: "Andorra Tax Number",
  localName: "Número de Registre Tributari",
  abbreviation: "NRT",
  aliases: [
    "NRT",
    "Número de Registre Tributari",
  ] as const,
  candidatePattern: "[A-Z]-?\\d{6}-?[A-Z]",
  country: "AD",
  entityType: "any",
  sourceUrl: 
    "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Andorra-TIN.pdf",
  examples: ["U132950X", "D059888N", "F123456M"] as const,
  compact,
  format,
  validate,
};

export default nrt;
export { compact, format, validate };

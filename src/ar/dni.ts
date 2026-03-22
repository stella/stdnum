/**
 * DNI (Documento Nacional de Identidad).
 *
 * Argentine national identity card number. The DNI is
 * a 7 or 8-digit number assigned to all Argentine
 * citizens and permanent residents. No check digit.
 *
 * @see https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -.").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length < 7 || v.length > 8) {
    return err(
      "INVALID_LENGTH",
      "DNI must be 7 or 8 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "DNI must contain only digits",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 8) {
    return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  }
  return `${v.slice(0, 1)}.${v.slice(1, 4)}.${v.slice(4)}`;
};

/** Argentine National Identity Document. */
const dni: Validator = {
  name: "Argentine Identity Card",
  localName: "Documento Nacional de Identidad",
  abbreviation: "DNI",
  aliases: [
    "DNI",
    "Documento Nacional de Identidad",
    "Documento de Identidad",
  ] as const,
  candidatePattern: "\\d{1,2}\\.?\\d{3}\\.?\\d{3}",
  country: "AR",
  entityType: "person",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)",
  lengths: [7, 8] as const,
  examples: ["20123456", "12345678"] as const,
  compact,
  format,
  validate,
};

export default dni;
export { compact, format, validate };

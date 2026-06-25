/**
 * DNI (Documento Nacional de Identidad).
 *
 * Spanish national identity document number.
 * 1-8 digits followed by a check letter determined
 * by the remainder of dividing the number by 23.
 *
 * @see https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/
 */

import type {
  ValidateResult,
  CountryValidator,
} from "../types";

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const CHECK_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 2 || v.length > 9) {
    return err(
      "INVALID_LENGTH",
      "DNI must be 1-8 digits and 1 letter",
    );
  }

  const digits = v.slice(0, -1);
  const letter = v.slice(-1);

  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "DNI must start with 1-8 digits",
    );
  }

  const expected = CHECK_LETTERS.charAt(
    Number(digits) % 23,
  );
  if (letter !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "DNI check letter does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Spanish DNI. */
const generate = (): string => {
  const num = randomDigits(8);
  return num + CHECK_LETTERS[Number(num) % 23];
};

/** Spanish National Identity Document. */
const dni: CountryValidator<"ES"> = {
  name: "Spanish National ID",
  localName: "Documento Nacional de Identidad",
  abbreviation: "DNI",
  aliases: [
    "D.N.I.",
    "DNI",
    "documento nacional de identidad",
  ] as const,
  candidatePattern: "\\d{1,2}\\.?\\d{3}\\.?\\d{3}-?[A-Z]",
  scope: "country",
  country: "ES",
  entityType: "person",
  sourceUrl:
    "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/",
  examples: ["54362315K"] as const,
  compact,
  format,
  validate,
  generate,
};

export default dni;
export {
  CHECK_LETTERS,
  compact,
  format,
  validate,
  generate,
};

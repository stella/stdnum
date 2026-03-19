/**
 * DNI (Documento Nacional de Identidad).
 *
 * Spanish national identity document number.
 * 8 digits followed by a check letter determined
 * by the remainder of dividing the number by 23.
 *
 * @see https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const CHECK_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "DNI must be 8 digits and 1 letter",
    );
  }

  const digits = v.slice(0, 8);
  const letter = v[8];

  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "DNI must start with 8 digits",
    );
  }

  const expected = CHECK_LETTERS[Number(digits) % 23];
  if (letter !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "DNI check letter does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Spanish National Identity Document. */
const dni: Validator = {
  name: "Spanish National ID",
  localName: "Documento Nacional de Identidad",
  abbreviation: "DNI",
  country: "ES",
  entityType: "person",
  compact,
  format,
  validate,
};

export default dni;
export { CHECK_LETTERS, compact, format, validate };

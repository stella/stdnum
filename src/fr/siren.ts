/**
 * SIREN (Système d'Identification du Répertoire
 * des Entreprises).
 *
 * French company identification number. 9 digits
 * validated with standard Luhn algorithm.
 *
 * @see https://www.insee.fr/fr/information/2549588
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "SIREN must be exactly 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "SIREN must contain only digits",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "SIREN fails Luhn check",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
};

/** French Company Identification Number. */
const siren: Validator = {
  name: "French Company ID",
  localName:
    "Système d'Identification du Répertoire des Entreprises",
  abbreviation: "SIREN",
  country: "FR",
  entityType: "company",
  examples: ["552008443"] as const,
  compact,
  format,
  validate,
};

export default siren;
export { compact, format, validate };

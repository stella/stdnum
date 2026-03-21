/**
 * ICE (Identifiant Commun de l'Entreprise).
 *
 * Moroccan company identification number. 15 digits:
 * 9 enterprise digits + 4 establishment digits +
 * 2 check digits. Uses Mod 97-10 checksum
 * (full number mod 97 must equal 0).
 *
 * @see https://www.ice.gov.ma/
 */

import { mod97 } from "#checksums/mod97";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " ");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "Moroccan ICE must be exactly 15 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Moroccan ICE must contain only digits",
    );
  }
  if (mod97(v) !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Moroccan ICE check digits mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  compact(value);

/** Generate a random valid Moroccan ICE. */
const generate = (): string => { for (;;) { const c = randomDigits(15); if (validate(c).valid) return c; } };

/** Moroccan Company Identification Number. */
const ice: Validator = {
  name: "Moroccan Company Identification Number",
  localName: "Identifiant Commun de l'Entreprise",
  abbreviation: "ICE",
  aliases: [
    "ICE",
    "Identifiant Commun de l'Entreprise",
  ] as const,
  candidatePattern: "\\d{15}",
  country: "MA",
  entityType: "company",
  compact,
  format,
  validate,
  description:
    "Moroccan common enterprise identifier",
  sourceUrl: "https://www.ice.gov.ma/",
  lengths: [15] as const,
  examples: [
    "001561191000066",
    "002136093000040",
  ] as const,
  generate,
};

export default ice;
export { compact, format, validate, generate };

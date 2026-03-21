/**
 * SIRET (Système d'Identification du Répertoire
 * des Établissements).
 *
 * French establishment identification number.
 * 14 digits: SIREN (9) + NIC (5). Validated
 * with Luhn, with a special case for La Poste.
 *
 * @see https://www.insee.fr/fr/information/2549588
 */

import { luhnValidate, luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -.");

/**
 * La Poste SIRET uses digit sum % 5 instead of
 * Luhn, EXCEPT the head office (35600000000048)
 * which uses standard Luhn.
 */
const isLaPoste = (v: string): boolean =>
  v.startsWith("356000000") && v !== "35600000000048";

const digitSum = (v: string): number => {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += Number(v[i]);
  }
  return sum;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 14) {
    return err(
      "INVALID_LENGTH",
      "SIRET must be exactly 14 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "SIRET must contain only digits",
    );
  }

  // Validate SIREN part (first 9 digits)
  const siren = v.slice(0, 9);
  if (!luhnValidate(siren) && !isLaPoste(v)) {
    return err(
      "INVALID_CHECKSUM",
      "SIRET SIREN part fails Luhn check",
    );
  }

  // La Poste: digit sum mod 5
  if (isLaPoste(v)) {
    if (digitSum(v) % 5 !== 0) {
      return err(
        "INVALID_CHECKSUM",
        "SIRET La Poste digit sum check failed",
      );
    }
  } else {
    // Standard: full 14-digit Luhn
    if (!luhnValidate(v)) {
      return err(
        "INVALID_CHECKSUM",
        "SIRET fails Luhn check",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 9)} ${v.slice(9)}`;
};

/** Generate a random valid French SIRET. */
const generate = (): string => {
  const sp = randomDigits(8);
  const sc = luhnChecksum(sp + "0");
  const siren = sp + String((10 - sc) % 10);
  const nic = randomDigits(4);
  const payload = siren + nic;
  const cs = luhnChecksum(payload + "0");
  return payload + String((10 - cs) % 10);
};

/** French Establishment Identification Number. */
const siret: Validator = {
  name: "French Establishment ID",
  localName:
    "Système d'Identification du Répertoire des Établissements",
  abbreviation: "SIRET",
  aliases: ["SIRET", "numéro SIRET"] as const,
  candidatePattern:
    "\\d{3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{5}",
  country: "FR",
  entityType: "company",
  sourceUrl: 
    "https://www.insee.fr/fr/information/2549588",
  examples: ["73282932000074"] as const,
  compact,
  format,
  validate,
  generate,
};

export default siret;
export { compact, format, validate, generate };

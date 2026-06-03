/**
 * Organisationsnummer (Swedish organization number).
 *
 * 10 digits. Standard Luhn checksum.
 * Display format: NNNNNN-NNNN.
 *
 * @see https://www.skatteverket.se/
 */

import type {
  ValidateResult,
  CountryValidator,
} from "../types";

import {
  luhnValidate,
  luhnChecksum,
} from "#checksums/luhn";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "Swedish Organisationsnummer must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Swedish Organisationsnummer must contain only digits",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Swedish Organisationsnummer Luhn check failed",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 6)}-${v.slice(6)}`;
};

/** Generate a random valid Swedish org number. */
const generate = (): string => {
  const p = randomDigits(9);
  const cs = luhnChecksum(p + "0");
  return p + String((10 - cs) % 10);
};

/** Swedish Organization Number. */
const orgnr: CountryValidator<"SE"> = {
  name: "Swedish Organization Number",
  localName: "Organisationsnummer",
  abbreviation: "Orgnr",
  aliases: [
    "organisationsnummer",
    "org.nr",
    "org nr",
  ] as const,
  candidatePattern: "\\d{6}-\\d{4}",
  scope: "country",
  country: "SE",
  entityType: "company",
  sourceUrl: "https://www.skatteverket.se/",
  examples: ["1234567897"] as const,
  compact,
  format,
  validate,
  generate,
};

export default orgnr;
export { compact, format, validate, generate };

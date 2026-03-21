/**
 * BN (Canadian Business Number).
 *
 * 9-digit BN root (Luhn checksum) optionally
 * followed by a 2-letter program type (RC, RM,
 * RP, RT) and a 4-digit reference number (BN15).
 *
 * @see https://www.canada.ca/en/services/taxes/business-number.html
 */

import { luhnValidate, luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const VALID_PROGRAMS = new Set(["RC", "RM", "RP", "RT"]);

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9 && v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "BN must be 9 or 15 characters",
    );
  }
  if (!isdigits(v.slice(0, 9))) {
    return err(
      "INVALID_FORMAT",
      "BN root must contain only digits",
    );
  }
  if (!luhnValidate(v.slice(0, 9))) {
    return err(
      "INVALID_CHECKSUM",
      "BN Luhn check digit mismatch",
    );
  }
  if (v.length === 15) {
    const program = v.slice(9, 11);
    if (!VALID_PROGRAMS.has(program)) {
      return err(
        "INVALID_COMPONENT",
        "BN program type must be RC, RM, RP, or RT",
      );
    }
    if (!isdigits(v.slice(11))) {
      return err(
        "INVALID_FORMAT",
        "BN reference number must be digits",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 15) {
    return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 9)} ${v.slice(9, 11)} ${v.slice(11)}`;
  }
  if (v.length === 9) {
    return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
  }
  return v;
};

/** Generate a random valid Canadian BN. */
const generate = (): string => {
  const payload = randomDigits(8);
  const cs = luhnChecksum(payload + "0");
  return payload + String((10 - cs) % 10);
};

/** Canadian Business Number. */
const bn: Validator = {
  name: "Business Number",
  localName: "Business Number",
  abbreviation: "BN",
  aliases: [
    "BN",
    "Business Number",
    "numéro d'entreprise",
  ] as const,
  candidatePattern:
    "\\d{9}\\s?[A-Z]{2}\\s?\\d{4}",
  country: "CA",
  entityType: "company",
  sourceUrl: 
    "https://www.canada.ca/en/services/taxes/business-number.html",
  examples: ["123026635", "123026635RC0001"] as const,
  compact,
  format,
  validate,
  generate,
};

export default bn;
export { compact, format, validate, generate };

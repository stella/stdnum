/**
 * PIB (Poreski identifikacioni broj).
 *
 * Serbian tax identification number. 9 digits with
 * a mod 11 checksum (ISO 7064 variant).
 *
 * @see https://en.wikipedia.org/wiki/Tax_identification_number_(Serbia)
 * @see https://www.purs.gov.rs/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "PIB must be exactly 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "PIB must contain only digits",
    );
  }

  // ISO 7064 Mod 11, 10 checksum
  let t = 10;
  for (let i = 0; i < 8; i++) {
    t = (t + Number(v[i])) % 10;
    if (t === 0) t = 10;
    t = (t * 2) % 11;
  }
  const check = (11 - t) % 10;
  if (check !== Number(v[8])) {
    return err(
      "INVALID_CHECKSUM",
      "PIB check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Serbian Tax Identification Number. */
const pib: Validator = {
  name: "Serbian Tax ID",
  localName: "Poreski identifikacioni broj",
  abbreviation: "PIB",
  aliases: [
    "PIB",
    "poreski identifikacioni broj",
  ] as const,
  candidatePattern: "\\d{9}",
  country: "RS",
  entityType: "any",
  lengths: [9] as const,
  sourceUrl: "https://www.purs.gov.rs/",
  examples: ["101134702"] as const,
  compact,
  format,
  validate,
};

export default pib;
export { compact, format, validate };

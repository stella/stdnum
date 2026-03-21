/**
 * CVR (Danish VAT / business registration number).
 *
 * 8 digits, no leading 0.
 * Weights [2,7,6,5,4,3,2,1], sum % 11 === 0.
 *
 * @see https://www.vatify.eu/denmark-vat-number.html
 * @see https://erhvervsstyrelsen.dk/det-centrale-virksomhedsregister-cvr
 *
 * Denmark dropped mod-11 for CPR in 2007; unconfirmed
 * for CVR.
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("DK") || v.startsWith("dk")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Danish VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Danish VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Danish VAT number cannot start with 0",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Danish VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `DK${compact(value)}`;

/** Generate a random valid Danish VAT number. */
const generate = (): string => { for (;;) { const c = String(randomInt(1, 9)) + randomDigits(7); if (validate(c).valid) return c; } };

/** Danish VAT Number. */
const vat: Validator = {
  name: "Danish VAT Number",
  localName: "Momsregistreringsnummer",
  abbreviation: "CVR",
  aliases: [
    "momsnummer",
    "SE-nummer",
  ] as const,
  candidatePattern: "DK\\d{8}",
  country: "DK",
  entityType: "company",
  sourceUrl: "https://erhvervsstyrelsen.dk/",
  examples: ["13585628"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

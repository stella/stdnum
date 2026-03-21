/**
 * CIF/CUI (Romanian VAT number).
 *
 * 2-10 digits. Pad to 10, weights
 * [7,5,3,2,1,7,5,3,2], check =
 * (10 * sum) % 11 % 10 === last digit.
 *
 * @see https://www.vatify.eu/romania-vat-number.html
 * @see https://www.anaf.ro/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const WEIGHTS = [7, 5, 3, 2, 1, 7, 5, 3, 2];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("RO") || v.startsWith("ro")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 2 || v.length > 10) {
    return err(
      "INVALID_LENGTH",
      "Romanian VAT number must be 2 to 10 digits",
    );
  }
  if (!isdigits(v) || v[0] === "0") {
    return err(
      "INVALID_FORMAT",
      "Romanian VAT number must contain only digits " +
        "and must not start with 0",
    );
  }
  // Pad to 10 digits
  const padded = v.padStart(10, "0");
  const sum = weightedSum(padded.slice(0, 9), WEIGHTS, 11);
  const check = ((sum * 10) % 11) % 10;
  if (check !== Number(padded[9])) {
    return err(
      "INVALID_CHECKSUM",
      "Romanian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `RO${compact(value)}`;

/** Generate a random valid Romanian VAT number. */
const generate = (): string => {
  for (;;) {
    const c = String(randomInt(1, 9)) + randomDigits(randomInt(1, 9));
    if (validate(c).valid) return c;
  }
};

/** Romanian VAT Number. */
const vat: Validator = {
  name: "Romanian VAT Number",
  localName: "Cod de Identificare Fiscală",
  abbreviation: "CIF",
  aliases: [
    "CUI",
    "CIF",
    "cod de identificare fiscală",
    "cod fiscal",
  ] as const,
  candidatePattern: "RO\\d{2,10}",
  country: "RO",
  entityType: "any",
  sourceUrl: "https://www.anaf.ro/",
  examples: ["18547290"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

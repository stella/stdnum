/**
 * Momsnr. (Swedish VAT number).
 *
 * 12 digits, last 2 must be "01".
 * Luhn check on first 10 digits.
 *
 * @see https://www.vatify.eu/sweden-vat-number.html
 * @see https://www.skatteverket.se/
 */

import { luhnValidate, luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("SE") || v.startsWith("se")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Swedish VAT number must be 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Swedish VAT number must contain only digits",
    );
  }
  if (v.slice(10, 12) !== "01") {
    return err(
      "INVALID_COMPONENT",
      "Swedish VAT number must end with 01",
    );
  }
  if (!luhnValidate(v.slice(0, 10))) {
    return err(
      "INVALID_CHECKSUM",
      "Swedish VAT number Luhn check failed",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `SE${compact(value)}`;

/** Generate a random valid Swedish VAT number. */
const generate = (): string => {
  const p = randomDigits(9);
  const cs = luhnChecksum(p + "0");
  return p + String((10 - cs) % 10) + "01";
};

/** Swedish VAT Number. */
const vat: Validator = {
  name: "Swedish VAT Number",
  localName: "Momsregistreringsnummer",
  abbreviation: "Momsnr.",
  country: "SE",
  entityType: "company",
  sourceUrl: "https://www.skatteverket.se/",
  examples: ["556188840401"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

/**
 * OIB (Croatian VAT number).
 *
 * 11 digits. ISO 7064 Mod 11,10 checksum.
 *
 * @see https://www.vatify.eu/croatia-vat-number.html
 * @see https://www.porezna-uprava.hr/
 */

import {
  mod1110validate,
  mod1110checkDigit,
} from "#checksums/mod1110";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("HR") || v.startsWith("hr")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Croatian VAT number must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Croatian VAT number must contain only digits",
    );
  }
  if (!mod1110validate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Croatian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `HR${compact(value)}`;

/** Generate a random valid Croatian OIB. */
const generate = (): string => {
  const payload = randomDigits(10);
  return payload + String(mod1110checkDigit(payload));
};

/** Croatian VAT Number. */
const vat: Validator = {
  name: "Croatian VAT Number",
  localName: "Osobni identifikacijski broj",
  abbreviation: "OIB",
  aliases: ["OIB", "osobni identifikacijski broj"] as const,
  candidatePattern: "HR\\d{11}",
  country: "HR",
  entityType: "any",
  sourceUrl: "https://www.porezna-uprava.hr/",
  examples: ["33392005961"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

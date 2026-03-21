/**
 * USt-IdNr. (Umsatzsteuer-Identifikationsnummer).
 *
 * German VAT identification number. Format:
 * "DE" + 9 digits. The last digit is a check
 * digit computed using ISO 7064 Mod 11,10.
 *
 * @see https://www.bzst.de/DE/Unternehmen/Identifikationsnummern/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html
 * @see https://www.bzst.de/SharedDocs/Downloads/DE/Merkblaetter/ust_idnr_aufbau.pdf
 */

import {
  mod1110checkDigit,
  mod1110validate,
} from "#checksums/mod1110";
import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  const v = clean(value, " -/");
  if (v.startsWith("DE") || v.startsWith("de")) {
    return v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "German VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "German VAT number must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "German VAT number cannot start with 0",
    );
  }
  if (!mod1110validate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "German VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `DE${compact(value)}`;

/** Generate a random valid German VAT number. */
const generate = (): string => {
  const first = String(randomInt(1, 9));
  const rest = randomDigits(7);
  const payload = `${first}${rest}`;
  const check = mod1110checkDigit(payload);
  return `${payload}${String(check)}`;
};

/** German VAT Identification Number. */
const vat: Validator = {
  name: "German VAT Number",
  localName: "Umsatzsteuer-Identifikationsnummer",
  abbreviation: "USt-IdNr.",
  aliases: [
    "USt-IdNr",
    "Umsatzsteuer-Identifikationsnummer",
    "VAT DE",
  ] as const,
  candidatePattern: "DE\\d{9}",
  country: "DE",
  entityType: "company",
  description:
    "German VAT ID issued by the Federal Tax Office (BZSt)",
  sourceUrl:
    "https://www.bzst.de/DE/Unternehmen/Identifikationsnummern/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html",
  lengths: [9] as const,
  examples: ["136695976"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, generate, validate };

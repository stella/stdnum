/**
 * BTW (Dutch VAT number).
 *
 * 12 characters: 9 digits + "B" + 2 digits.
 *
 * The current Dutch VAT identification number
 * (btw-id) format is structural: `NL` + 9 digits
 * + `B` + 2 digits. The official guidance explicitly
 * states that the 9 digits are not derived from BSN
 * and the final 2 digits are random.
 *
 * @see https://business.gov.nl/regulations/using-checking-vat-numbers/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("NL") || v.startsWith("nl")) {
    v = v.slice(2);
  }
  v = v.toUpperCase();
  // Zero-pad numeric part to 9 digits if B is found
  const bIdx = v.indexOf("B");
  if (bIdx > 0 && bIdx < 9) {
    v = v.slice(0, bIdx).padStart(9, "0") + v.slice(bIdx);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Dutch VAT number must be 12 characters",
    );
  }
  if (!isdigits(v.slice(0, 9))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must start with 9 digits",
    );
  }
  if (v[9] !== "B") {
    return err(
      "INVALID_COMPONENT",
      "Dutch VAT number digit 10 must be B",
    );
  }
  if (!isdigits(v.slice(10, 12))) {
    return err(
      "INVALID_FORMAT",
      "Dutch VAT number must end with 2 digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `NL${compact(value)}`;

/** Generate a random valid Dutch VAT number. */
const generate = (): string =>
  `${randomDigits(9)}B${randomDigits(2)}`;

/** Dutch VAT Number. */
const vat: Validator = {
  name: "Dutch VAT Number",
  localName: "BTW-identificatienummer",
  abbreviation: "BTW",
  aliases: ["BTW-nummer", "BTW-id"] as const,
  candidatePattern: "NL\\d{9}B\\d{2}",
  country: "NL",
  entityType: "company",
  sourceUrl:
    "https://business.gov.nl/regulations/using-checking-vat-numbers/",
  examples: ["000099998B57"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

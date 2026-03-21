/**
 * TFN (Australian Tax File Number).
 *
 * 8 or 9 digit identifier. Weighted checksum with
 * weights [1,4,3,7,5,8,6,9,10]; sum mod 11
 * must equal 0.
 *
 * @see https://en.wikipedia.org/wiki/Tax_file_number
 * @see https://www.ato.gov.au/Individuals/Tax-file-number/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [1, 4, 3, 7, 5, 8, 6, 9, 10] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "TFN must contain only digits",
    );
  }
  if (v.length !== 8 && v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "TFN must be 8 or 9 digits",
    );
  }

  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += Number(v[i]) * WEIGHTS[i];
  }
  if (sum % 11 !== 0) {
    return err("INVALID_CHECKSUM", "TFN checksum mismatch");
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 8 || v.length === 9) {
    return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
  }
  return v;
};

/** Generate a random valid TFN. */
const generate = (): string => { for (;;) { const c = randomDigits(9); if (validate(c).valid) return c; } };

/** Australian Tax File Number. */
const tfn: Validator = {
  name: "Tax File Number",
  localName: "Tax File Number",
  abbreviation: "TFN",
  aliases: [
    "TFN",
    "Tax File Number",
  ] as const,
  candidatePattern: "\\d{8,9}",
  country: "AU",
  entityType: "person",
  sourceUrl: 
    "https://www.ato.gov.au/individuals-and-families/tax-file-number",
  examples: ["87650006", "123456782"] as const,
  compact,
  format,
  validate,
  generate,
};

export default tfn;
export { compact, format, validate, generate };

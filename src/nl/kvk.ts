/** Generate a random valid Dutch KvK number. */
const generate = (): string => randomDigits(8);

/**
 * KvK-nummer (Dutch Chamber of Commerce number).
 *
 * 8 digits. Format-only validation; no checksum.
 *
 * @see https://www.kvk.nl/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -/.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Dutch KvK number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Dutch KvK number must contain only digits",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Dutch Chamber of Commerce Number. */
const kvk: Validator = {
  name: "Dutch Chamber of Commerce Number",
  localName: "KvK-nummer",
  abbreviation: "KvK",
  aliases: ["KVK-nummer", "Kamer van Koophandel"] as const,
  candidatePattern: "\\d{8}",
  country: "NL",
  entityType: "company",
  sourceUrl: "https://www.kvk.nl/",
  examples: ["12345678"] as const,
  compact,
  format,
  validate,
  generate,
};

export default kvk;
export { compact, format, validate, generate };

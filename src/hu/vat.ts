/**
 * ANUM (Hungarian VAT number).
 *
 * 8 digits. Weights [9,7,3,1,9,7,3,1],
 * sum % 10 === 0.
 *
 * @see https://www.vatify.eu/hungary-vat-number.html
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/hungary-tin.pdf
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [9, 7, 3, 1, 9, 7, 3, 1];

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("HU") || v.startsWith("hu")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Hungarian VAT number must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Hungarian VAT number must contain only digits",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 10);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Hungarian VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `HU${compact(value)}`;

/** Generate a random valid Hungarian VAT number. */
const generate = (): string => {
  for (;;) {
    const c = randomDigits(8);
    if (validate(c).valid) return c;
  }
};

/** Hungarian VAT Number. */
const vat: Validator = {
  name: "Hungarian VAT Number",
  localName: "Adószám",
  abbreviation: "ANUM",
  aliases: ["adószám", "adóazonosító jel"] as const,
  candidatePattern: "\\d{8}-\\d-\\d{2}",
  country: "HU",
  entityType: "company",
  sourceUrl: "https://nav.gov.hu/",
  examples: ["12892312"] as const,
  compact,
  format,
  validate,
  generate,
};

export default vat;
export { compact, format, validate, generate };

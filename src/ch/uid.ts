/**
 * UID (Unternehmens-Identifikationsnummer).
 *
 * Swiss business identification number. 12 characters:
 * "CHE" prefix + 9 digits. Check digit uses weights
 * [5,4,3,2,7,6,5,4] on the first 8 digits.
 *
 * @see https://www.uid.admin.ch/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4] as const;

const compact = (value: string): string =>
  clean(value, " -./").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Swiss UID must be CHE + 9 digits",
    );
  }
  if (!v.startsWith("CHE")) {
    return err(
      "INVALID_COMPONENT",
      "Swiss UID must start with CHE",
    );
  }
  const digits = v.slice(3);
  if (!isdigits(digits)) {
    return err(
      "INVALID_FORMAT",
      "Swiss UID must be CHE + 9 digits",
    );
  }

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(digits[i]) * WEIGHTS[i];
  }
  const check = (11 - (sum % 11)) % 11;
  if (check === 10) {
    return err(
      "INVALID_CHECKSUM",
      "Swiss UID check digit is invalid",
    );
  }
  if (check !== Number(digits[8])) {
    return err(
      "INVALID_CHECKSUM",
      "Swiss UID check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const d = v.slice(3);
  return `CHE-${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
};

/** Generate a random valid Swiss UID. */
const generate = (): string => {
  for (let i = 0; i < 100; i++) {
    const payload = randomDigits(8);
    let sum = 0;
    for (let j = 0; j < 8; j++) sum += Number(payload[j]) * WEIGHTS[j];
    const check = (11 - (sum % 11)) % 11;
    if (check === 10) continue;
    return "CHE" + payload + String(check);
  }
  throw new Error("Failed to generate valid Swiss UID");
};

/** Swiss Business Identification Number. */
const uid: Validator = {
  name: "Swiss Business ID",
  localName: "Unternehmens-Identifikationsnummer",
  abbreviation: "UID",
  country: "CH",
  entityType: "company",
  sourceUrl: "https://www.uid.admin.ch/",
  examples: ["CHE100155212"] as const,
  compact,
  format,
  validate,
  generate,
};

export default uid;
export { compact, format, validate, generate };

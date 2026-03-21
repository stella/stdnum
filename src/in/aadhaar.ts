/**
 * Aadhaar (Indian unique identity number).
 *
 * 12 digits with Verhoeff checksum (last digit).
 * Cannot start with 0 or 1.
 * Issued by the Unique Identification Authority
 * of India (UIDAI).
 *
 * @see https://en.wikipedia.org/wiki/Aadhaar
 * @see https://uidai.gov.in/
 */

import { verhoeffValidate } from "#checksums/verhoeff";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Aadhaar must be 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Aadhaar must contain only digits",
    );
  }
  if (v[0] === "0" || v[0] === "1") {
    return err(
      "INVALID_COMPONENT",
      "Aadhaar cannot start with 0 or 1",
    );
  }
  // Aadhaar cannot be a palindrome
  if (v === v.split("").reverse().join("")) {
    return err(
      "INVALID_FORMAT",
      "Aadhaar cannot be a palindrome",
    );
  }
  if (!verhoeffValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Aadhaar check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 4)} ${v.slice(4, 8)} ${v.slice(8)}`;
};

/** Indian Unique Identity Number. */
const aadhaar: Validator = {
  name: "Indian Unique Identity Number",
  localName: "Aadhaar",
  abbreviation: "Aadhaar",
  aliases: ["Aadhaar", "आधार"] as const,
  candidatePattern:
    "\\d{4}\\s?\\d{4}\\s?\\d{4}",
  country: "IN",
  entityType: "person",
  lengths: [12],
  examples: ["234123412346", "295274982189"],
  description:
    "12-digit unique identity number issued by UIDAI",
  sourceUrl: "https://uidai.gov.in/",
  compact,
  format,
  validate,
};

export default aadhaar;
export { compact, format, validate };

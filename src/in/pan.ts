/** Generate a random valid Indian PAN. */
const generate = (): string => {
  const randomLetter = (): string =>
    String.fromCodePoint(65 + randomInt(0, 25));
  const first3 =
    randomLetter() + randomLetter() + randomLetter();
  const holderType =
    HOLDER_TYPES[randomInt(0, HOLDER_TYPES.length - 1)]!;
  const fifth = randomLetter();
  const digits = randomDigits(4);
  const last = randomLetter();
  return `${first3}${holderType}${fifth}${digits}${last}`;
};

/**
 * PAN (Permanent Account Number, Indian tax ID).
 *
 * 10 characters: 5 letters + 4 digits + 1 letter.
 * The 4th letter encodes the holder type
 * (P=person, C=company, H=HUF, A=AOP, B=BOI,
 * G=government, J=AJP, L=local authority, F=FOP,
 * T=trust). The 5th letter is the first letter
 * of the surname or entity name.
 * No checksum; format validation only.
 *
 * @see https://en.wikipedia.org/wiki/Permanent_account_number
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;

const HOLDER_TYPES = "ABCFGHJLPT";

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10) {
    return err(
      "INVALID_LENGTH",
      "PAN must be 10 characters",
    );
  }
  if (!PAN_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "PAN must be 5 letters + 4 digits + 1 letter",
    );
  }
  if (!HOLDER_TYPES.includes(v[3]!)) {
    return err(
      "INVALID_COMPONENT",
      "PAN 4th character must be a valid holder type",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Indian Permanent Account Number. */
const pan: Validator = {
  name: "Indian Permanent Account Number",
  localName: "Permanent Account Number",
  abbreviation: "PAN",
  aliases: ["PAN", "Permanent Account Number"] as const,
  candidatePattern: "[A-Z]{5}\\d{4}[A-Z]",
  country: "IN",
  entityType: "any",
  lengths: [10],
  examples: ["ABCPP1234C", "AAACR5055K"],
  description: "10-character alphanumeric tax identifier",
  sourceUrl:
    "https://en.wikipedia.org/wiki/Permanent_account_number",
  compact,
  format,
  validate,
  generate,
};

export default pan;
export { compact, format, validate, generate };

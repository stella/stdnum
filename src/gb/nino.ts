/**
 * NINO (National Insurance Number).
 *
 * UK National Insurance Number. Format: 2 letters
 * + 6 digits + 1 suffix letter (A, B, C, or D).
 * Validated by format and prefix rules only; there
 * is no checksum.
 *
 * @see https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const INVALID_FIRST = new Set([
  "D", "F", "I", "Q", "U", "V",
]);

const INVALID_SECOND = new Set([
  "D", "F", "I", "O", "Q", "U", "V",
]);

const INVALID_PREFIX = new Set([
  "BG", "GB", "NK", "KN", "TN", "NT", "ZZ",
]);

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "UK NINO must be 9 characters",
    );
  }

  if (!/^[A-Z]{2}\d{6}[A-D]$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "UK NINO must be 2 letters, 6 digits, " +
        "then A/B/C/D",
    );
  }

  const first = v[0]!;
  const second = v[1]!;
  const prefix = v.slice(0, 2);

  if (INVALID_FIRST.has(first)) {
    return err(
      "INVALID_COMPONENT",
      `UK NINO first letter cannot be ${first}`,
    );
  }

  if (INVALID_SECOND.has(second)) {
    return err(
      "INVALID_COMPONENT",
      `UK NINO second letter cannot be ${second}`,
    );
  }

  if (INVALID_PREFIX.has(prefix)) {
    return err(
      "INVALID_COMPONENT",
      `UK NINO prefix ${prefix} is not allowed`,
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return (
    `${v.slice(0, 2)} ${v.slice(2, 4)}` +
    ` ${v.slice(4, 6)} ${v.slice(6, 8)}` +
    ` ${v.slice(8)}`
  );
};

/** UK National Insurance Number. */
const nino: Validator = {
  name: "UK National Insurance Number",
  localName: "National Insurance Number",
  abbreviation: "NINO",
  aliases: [
    "National Insurance number",
    "NINO",
    "NI number",
  ] as const,
  candidatePattern: "[A-Z]{2}\\d{6}[A-Z]",
  country: "GB",
  entityType: "person",
  description:
    "UK National Insurance Number for tax " +
    "and benefits",
  sourceUrl:
    "https://www.gov.uk/hmrc-internal-manuals/" +
    "national-insurance-manual/nim39110",
  lengths: [9] as const,
  examples: ["AB123456C"] as const,
  compact,
  format,
  validate,
};

export default nino;
export { compact, format, validate };

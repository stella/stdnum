/** Generate a random valid U.S. ITIN. */
const generate = (): string => {
  const area = "9" + randomDigits(2);
  const allowed = Array.from(
    { length: 30 },
    (_, i) => i + 70,
  ).filter((g) => g !== 89 && g !== 93);
  const group = String(
    allowed[randomInt(0, allowed.length - 1)]!,
  );
  const serial = randomDigits(4);
  return `${area}${group}${serial}`;
};

/**
 * ITIN (U.S. Individual Taxpayer Identification
 * Number).
 *
 * 9-digit number issued by the IRS to individuals
 * who need a taxpayer ID but are not eligible for
 * an SSN. Starts with 9; digits 4-5 (the "group")
 * must be in the range 70-99 excluding 89 and 93.
 *
 * @see https://www.irs.gov/individuals/individual-taxpayer-identification-number
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits, randomInt } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

const ITIN_RE =
  /^(?<area>\d{3})-?(?<group>\d{2})-?\d{4}$/;

/** Groups 70-99 excluding 89 and 93. */
const ALLOWED_GROUPS = new Set(
  Array.from({ length: 30 }, (_, i) => i + 70)
    .filter((g) => g !== 89 && g !== 93)
    .map(String),
);

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "ITIN must contain only digits",
    );
  }
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "ITIN must be 9 digits",
    );
  }

  const match = ITIN_RE.exec(v);
  if (!match?.groups) {
    return err(
      "INVALID_FORMAT",
      "ITIN must be 9 digits, optionally " +
        "formatted as NNN-NN-NNNN",
    );
  }

  const { area, group } = match.groups;
  if (!area || !group) {
    return err(
      "INVALID_FORMAT",
      "ITIN must be 9 digits",
    );
  }

  if (area[0] !== "9") {
    return err(
      "INVALID_COMPONENT",
      "ITIN area must start with 9",
    );
  }

  if (!ALLOWED_GROUPS.has(group)) {
    return err(
      "INVALID_COMPONENT",
      "ITIN group digits are not in the " +
        "allowed range (70-99 excl. 89, 93)",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return (
      `${v.slice(0, 3)}-${v.slice(3, 5)}` +
      `-${v.slice(5)}`
    );
  }
  return v;
};

/**
 * U.S. Individual Taxpayer Identification Number.
 */
const itin: Validator = {
  name: "Individual Taxpayer Identification Number",
  localName:
    "Individual Taxpayer Identification Number",
  abbreviation: "ITIN",
  aliases: [
    "ITIN",
    "Individual Taxpayer Identification Number",
  ] as const,
  candidatePattern: "9\\d{2}[\\s-]?\\d{2}[\\s-]?\\d{4}",
  country: "US",
  entityType: "person",
  sourceUrl:
    "https://www.irs.gov/individuals/" +
    "individual-taxpayer-identification-number",
  lengths: [9] as const,
  examples: ["912-90-3456"] as const,
  compact,
  format,
  validate,
  generate,
};

export default itin;
export { compact, format, validate, generate };

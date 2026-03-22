/**
 * Handelsregisternummer (German Company Register Number).
 *
 * German commercial register number assigned by the
 * local court (Amtsgericht). Format: register type
 * (HRA, HRB) + number, optionally with court name.
 *
 * HRA = Handelsregister Abteilung A (partnerships,
 * sole proprietors). HRB = Abteilung B (corporations).
 * GnR = Genossenschaftsregister.
 * PR = Partnerschaftsregister.
 * VR = Vereinsregister.
 *
 * No check digit; validation is structural only.
 *
 * @see https://de.wikipedia.org/wiki/Handelsregister_(Deutschland)
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

const REGISTER_TYPES = new Set([
  "HRA",
  "HRB",
  "GNR",
  "PR",
  "VR",
]);

const compact = (value: string): string =>
  clean(value, " .").trim().toUpperCase();

/**
 * Parse out the register type and number from
 * various formats like "HRB 12345", "HRB12345",
 * "Amtsgericht München HRB 12345".
 */
const parse = (
  value: string,
): { type: string; number: string } | null => {
  const v = compact(value);
  // Match register type followed by digits
  const match = v.match(/(HRA|HRB|GNR|PR|VR)\s*(\d+)/);
  if (!match) return null;
  return { type: match[1]!, number: match[2]! };
};

const validate = (value: string): ValidateResult => {
  const parsed = parse(value);

  if (!parsed) {
    return err(
      "INVALID_FORMAT",
      "Handelsregisternummer must contain a register "
        + "type (HRA, HRB, GnR, PR, VR) followed "
        + "by a number",
    );
  }

  if (!REGISTER_TYPES.has(parsed.type)) {
    return err(
      "INVALID_COMPONENT",
      "Invalid register type",
    );
  }

  if (
    parsed.number.length < 1
    || parsed.number.length > 7
  ) {
    return err(
      "INVALID_LENGTH",
      "Register number must be 1 to 7 digits",
    );
  }

  return {
    valid: true,
    compact: `${parsed.type} ${parsed.number}`,
  };
};

const format = (value: string): string => {
  const parsed = parse(value);
  if (!parsed) return compact(value);
  return `${parsed.type} ${parsed.number}`;
};

/** German Company Register Number. */
const handelsreg: Validator = {
  name: "German Company Register Number",
  localName: "Handelsregisternummer",
  abbreviation: "HReg",
  aliases: [
    "Handelsregisternummer",
    "Handelsregister",
    "HRB",
    "HRA",
  ] as const,
  candidatePattern:
    "(?:HRA|HRB|GnR|PR|VR)\\s*\\d{1,7}",
  country: "DE",
  entityType: "company",
  sourceUrl:
    "https://de.wikipedia.org/wiki/Handelsregister_(Deutschland)",
  examples: ["HRB 12345"] as const,
  compact: (v: string) => {
    const parsed = parse(v);
    if (!parsed) return clean(v, " .").trim();
    return `${parsed.type} ${parsed.number}`;
  },
  format,
  validate,
};

export default handelsreg;
export { compact, format, validate };

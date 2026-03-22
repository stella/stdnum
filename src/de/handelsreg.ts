/** Generate a random valid Handelsregisternummer. */
const generate = (): string => {
  const types = ["HRA", "HRB", "GNR", "PR", "VR"];
  const type =
    types[Math.floor(Math.random() * types.length)]!;
  const number = randomDigits(5);
  return `${type}${number}`;
};

/**
 * Handelsregisternummer (German Company Register Number).
 *
 * German commercial register number assigned by the
 * local court (Amtsgericht). Format: register type
 * (HRA, HRB, GnR, PR, VR) + number.
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
import { randomDigits } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

const REGISTER_TYPES = new Set([
  "HRA",
  "HRB",
  "GNR",
  "PR",
  "VR",
]);

/**
 * Strip separators and normalize to canonical form.
 * Accepts "HRB 12345", "HRB12345", "hrb 12345".
 */
const compact = (value: string): string => {
  const v = clean(value, " -.").trim().toUpperCase();
  const match = v.match(
    /^(HRA|HRB|GNR|PR|VR)(\d{1,7})$/,
  );
  if (!match) return v;
  return `${match[1]} ${match[2]}`;
};

const validate = (value: string): ValidateResult => {
  const v = clean(value, " -.").trim().toUpperCase();

  const match = v.match(/^([A-Z]{2,3})(\d{1,7})$/);
  if (!match) {
    return err(
      "INVALID_FORMAT",
      "Handelsregisternummer must be a register type "
        + "(HRA, HRB, GnR, PR, VR) followed by "
        + "1-7 digits",
    );
  }

  const type = match[1]!;
  const number = match[2]!;

  if (!REGISTER_TYPES.has(type)) {
    return err(
      "INVALID_COMPONENT",
      `Unrecognised register type "${type}"`,
    );
  }

  return {
    valid: true,
    compact: `${type} ${number}`,
  };
};

const format = (value: string): string =>
  compact(value);

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
  compact,
  format,
  validate,
  generate,
};

export default handelsreg;
export { compact, format, validate, generate };

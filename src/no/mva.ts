/**
 * MVA (Merverdiavgift, Norwegian VAT number).
 *
 * Format: optional "NO" prefix + 9 digits + "MVA" suffix.
 * The 9-digit part is validated as an Organisasjonsnummer.
 *
 * @see https://www.skatteetaten.no/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";
import { validate as validateOrgnr } from "./orgnr";

const compact = (value: string): string => {
  let v = clean(value, " -").toUpperCase();
  if (v.startsWith("NO")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (!v.endsWith("MVA")) {
    return err(
      "INVALID_FORMAT",
      "Norwegian VAT must end with MVA",
    );
  }

  const digits = v.slice(0, -3);
  const orgnrResult = validateOrgnr(digits);
  if (!orgnrResult.valid) {
    return orgnrResult;
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const digits = v.endsWith("MVA") ? v.slice(0, -3) : v;
  return `NO ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)} MVA`;
};

/** Norwegian VAT Number. */
const mva: Validator = {
  name: "Norwegian VAT Number",
  localName: "Merverdiavgift",
  abbreviation: "MVA",
  country: "NO",
  entityType: "company",
  compact,
  format,
  validate,
};

export default mva;
export { compact, format, validate };

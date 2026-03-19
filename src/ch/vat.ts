/**
 * Swiss VAT number.
 *
 * Format: CHE + 9 digits + suffix (MWST|TVA|IVA|TPV).
 * The numeric part is validated as a UID.
 *
 * @see https://www.ch.ch/en/value-added-tax-number-und-business-identification-number/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";
import { validate as validateUid } from "./uid";

const SUFFIXES = ["MWST", "TVA", "IVA", "TPV"] as const;

const compact = (value: string): string =>
  clean(value, " -./").toUpperCase();

const extractParts = (
  v: string,
): { uid: string; suffix: string } | undefined => {
  for (const s of SUFFIXES) {
    if (v.endsWith(s)) {
      return { uid: v.slice(0, -s.length), suffix: s };
    }
  }
  return undefined;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  const parts = extractParts(v);
  if (!parts) {
    return err(
      "INVALID_FORMAT",
      "Swiss VAT must end with MWST, TVA, IVA, or TPV",
    );
  }

  const uidResult = validateUid(parts.uid);
  if (!uidResult.valid) {
    return uidResult;
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const parts = extractParts(v);
  if (!parts) return v;
  const d = parts.uid.slice(3);
  return `CHE-${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)} ${parts.suffix}`;
};

/** Swiss VAT Number. */
const vat: Validator = {
  name: "Swiss VAT Number",
  localName: "Mehrwertsteuernummer",
  abbreviation: "MWST",
  country: "CH",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };

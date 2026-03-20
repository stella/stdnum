/**
 * EU VAT (European Union VAT Number).
 *
 * Dispatcher that routes to per-country VAT
 * validators. Extracts the 2-letter country prefix
 * and delegates to the matching country module.
 *
 * Special cases:
 *   - EL → Greece (gr.vat)
 *   - XI → Northern Ireland (gb.vat)
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import atUid from "../at/uid";
import beVat from "../be/vat";
import bgVat from "../bg/vat";
import cyVat from "../cy/vat";
import czDic from "../cz/dic";
import deVat from "../de/vat";
import dkVat from "../dk/vat";
import eeVat from "../ee/vat";
import esVat from "../es/vat";
import fiVat from "../fi/vat";
import frTva from "../fr/tva";
import gbVat from "../gb/vat";
import grVat from "../gr/vat";
import hrVat from "../hr/vat";
import huVat from "../hu/vat";
import ieVat from "../ie/vat";
import itIva from "../it/iva";
import ltVat from "../lt/vat";
import luVat from "../lu/vat";
import lvVat from "../lv/vat";
import mtVat from "../mt/vat";
import nlVat from "../nl/vat";
import plNip from "../pl/nip";
import ptVat from "../pt/vat";
import roVat from "../ro/vat";
import seVat from "../se/vat";
import siVat from "../si/vat";
import skDic from "../sk/dic";
import type { Validator, ValidateResult } from "../types";

type CountryValidator = {
  compact: (value: string) => string;
  validate: (value: string) => ValidateResult;
  format: (value: string) => string;
};

/**
 * Map of EU VAT country prefixes to their
 * country-specific validators.
 */
const VALIDATORS: Record<string, CountryValidator> = {
  AT: atUid,
  BE: beVat,
  BG: bgVat,
  CY: cyVat,
  CZ: czDic,
  DE: deVat,
  DK: dkVat,
  EE: eeVat,
  EL: grVat, // Greece uses EL prefix in EU VAT
  ES: esVat,
  FI: fiVat,
  FR: frTva,
  GR: grVat,
  HR: hrVat,
  HU: huVat,
  IE: ieVat,
  IT: itIva,
  LT: ltVat,
  LU: luVat,
  LV: lvVat,
  MT: mtVat,
  NL: nlVat,
  PL: plNip,
  PT: ptVat,
  RO: roVat,
  SE: seVat,
  SI: siVat,
  SK: skDic,
  XI: gbVat, // Northern Ireland
};

/**
 * Extract the 2-letter country prefix and the
 * remaining number from an EU VAT string.
 */
const splitPrefix = (
  value: string,
): { cc: string; rest: string } | undefined => {
  const v = clean(value, " -").toUpperCase();
  if (v.length < 3) return undefined;
  const cc = v.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(cc)) return undefined;
  return { cc, rest: v.slice(2) };
};

const compact = (value: string): string => {
  const parts = splitPrefix(value);
  if (parts === undefined) {
    return clean(value, " -").toUpperCase();
  }
  const validator = VALIDATORS[parts.cc];
  if (validator === undefined) {
    return clean(value, " -").toUpperCase();
  }
  return `${parts.cc}${validator.compact(parts.rest)}`;
};

const validate = (value: string): ValidateResult => {
  const parts = splitPrefix(value);
  if (parts === undefined) {
    return err(
      "INVALID_FORMAT",
      "EU VAT must start with a 2-letter country code",
    );
  }
  const validator = VALIDATORS[parts.cc];
  if (validator === undefined) {
    return err(
      "INVALID_COMPONENT",
      `Unsupported EU VAT country: ${parts.cc}`,
    );
  }
  const result = validator.validate(parts.rest);
  if (!result.valid) return result;
  return {
    valid: true,
    compact: `${parts.cc}${result.compact}`,
  };
};

/**
 * Format returns the compact EU VAT form:
 * `CC` + country-compacted number. Equivalent to
 * compact() because country format() methods
 * prepend their own prefix (e.g., AT UID format
 * returns "ATU..."), which would cause double-
 * prefixing if used here.
 */
const format = (value: string): string => {
  const parts = splitPrefix(value);
  if (parts === undefined) return value;
  const validator = VALIDATORS[parts.cc];
  if (validator === undefined) return value;
  return `${parts.cc}${validator.compact(parts.rest)}`;
};

/** European Union VAT Number. */
const euVat: Validator = {
  name: "EU VAT Number",
  localName: "EU VAT Number",
  abbreviation: "EU VAT",
  entityType: "company",
  examples: [
    "ATU13585627",
    "DE136695976",
  ] as const,
  compact,
  format,
  validate,
};

export default euVat;
export { compact, format, validate };

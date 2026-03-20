/**
 * n° TVA (taxe sur la valeur ajoutée, Monacan VAT).
 *
 * For VAT purposes Monaco is treated as French
 * territory. The number follows the French TVA
 * format but the SIREN part starts with "000"
 * (not a real SIREN). The compact form is
 * prefixed with "FR".
 *
 * @see https://www.economie.gouv.fr/
 */

import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";
import {
  compact as frCompact,
  validate as frValidate,
} from "../fr/tva";

const compact = (value: string): string => {
  const v = frCompact(value);
  return `FR${v}`;
};

const validate = (value: string): ValidateResult => {
  const frResult = frValidate(value);
  if (!frResult.valid) {
    return frResult;
  }

  // Monaco SIREN part must start with "000"
  const siren = frResult.compact.slice(2);
  if (!siren.startsWith("000")) {
    return err(
      "INVALID_COMPONENT",
      "Monacan TVA SIREN part must start with 000",
    );
  }

  return { valid: true, compact: `FR${frResult.compact}` };
};

const format = (value: string): string => compact(value);

/** Monacan VAT Number. */
const tva: Validator = {
  name: "Monacan VAT Number",
  localName: "Numéro de TVA",
  abbreviation: "TVA",
  country: "MC",
  entityType: "company",
  examples: ["FR53000004605"] as const,
  compact,
  format,
  validate,
};

export default tva;
export { compact, format, validate };

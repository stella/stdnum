/**
 * VSK (Virðisaukaskattur, Icelandic VAT number).
 *
 * 5 or 6 digits. Format-only validation, no checksum.
 *
 * @see https://www.rsk.is/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 5 && v.length !== 6) {
    return err(
      "INVALID_LENGTH",
      "Icelandic VAT must be 5 or 6 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Icelandic VAT must contain only digits",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Icelandic VAT Number. */
const vsk: Validator = {
  name: "Icelandic VAT Number",
  localName: "Virðisaukaskattur",
  abbreviation: "VSK",
  country: "IS",
  entityType: "company",
  compact,
  format,
  validate,
};

export default vsk;
export { compact, format, validate };

/**
 * BIS (BIS-nummer / Numéro BIS).
 *
 * Belgian BIS number for individuals not in the
 * National Register. 11 digits, structured like the
 * NN but with the month offset by 20 (gender unknown)
 * or 40 (gender known).
 *
 * @see https://sma-help.bosa.belgium.be/en/faq/where-can-i-find-my-bis-number
 * @see https://nl.wikipedia.org/wiki/Rijksregisternummer
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

import {
  checksum,
  format as nnFormat,
} from "./nn";

const compact = (value: string): string =>
  clean(value, " .-");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "BIS must be exactly 11 digits",
    );
  }
  if (!isdigits(v) || Number(v) === 0) {
    return err(
      "INVALID_FORMAT",
      "BIS must contain only digits",
    );
  }

  if (checksum(v) === null) {
    return err(
      "INVALID_CHECKSUM",
      "BIS check digits do not match",
    );
  }

  // Month must be in 20..32 or 40..52
  const rawMonth = Number(v.slice(2, 4));
  const inRange20 = rawMonth >= 20 && rawMonth <= 32;
  const inRange40 = rawMonth >= 40 && rawMonth <= 52;
  if (!inRange20 && !inRange40) {
    return err(
      "INVALID_COMPONENT",
      "Month must be in 20..32 or 40..52",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string =>
  nnFormat(compact(value));

/** Belgian BIS Number. */
const bis: Validator = {
  name: "Belgian BIS Number",
  localName: "BIS-nummer",
  abbreviation: "BIS",
  aliases: [
    "BIS-nummer",
    "numéro BIS",
  ] as const,
  candidatePattern:
    "\\d{2}\\.?\\d{2}\\.?\\d{2}-?\\d{3}\\.?\\d{2}",
  country: "BE",
  entityType: "person",
  sourceUrl:
    "https://sma-help.bosa.belgium.be/en/faq/where-can-i-find-my-bis-number",
  examples: ["98472899765"] as const,
  compact,
  format,
  validate,
};

export default bis;
export { compact, format, validate };

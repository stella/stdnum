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
import { randomInt } from "#util/generate";

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

/** Generate a random valid BIS number. */
const generate = (): string => {
  for (;;) {
    const yy = String(randomInt(0, 99)).padStart(2, "0");
    const offset = Math.random() < 0.5 ? 20 : 40;
    const mm = String(randomInt(1, 12) + offset).padStart(2, "0");
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const serial = String(randomInt(1, 997)).padStart(3, "0");
    const base = yy + mm + dd + serial;
    const n2 = Number("2" + base);
    const check2 = 97 - (n2 % 97);
    const c = base + String(check2).padStart(2, "0");
    if (validate(c).valid) return c;
  }
};

/** Belgian BIS Number. */
const bis: Validator = {
  name: "Belgian BIS Number",
  localName: "BIS-nummer",
  abbreviation: "BIS",
  country: "BE",
  entityType: "person",
  sourceUrl:
    "https://sma-help.bosa.belgium.be/en/faq/where-can-i-find-my-bis-number",
  examples: ["98472899765"] as const,
  compact,
  format,
  validate,
  generate,
};

export default bis;
export { compact, format, validate, generate };

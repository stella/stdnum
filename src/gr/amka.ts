/**
 * AMKA (Αριθμός Μητρώου Κοινωνικής Ασφάλισης).
 *
 * Greek social security number. 11 digits where the
 * first 6 are DDMMYY, followed by 4-digit serial and
 * a Luhn check digit.
 *
 * @see https://www.amka.gr/
 */

import { luhnValidate, luhnChecksum } from "#checksums/luhn";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "AMKA must be exactly 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "AMKA must contain only digits",
    );
  }

  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yy = Number(v.slice(4, 6));

  // AMKA doesn't encode century explicitly;
  // validate the date for both 1900s and 2000s
  const valid1900 = isValidDate(1900 + yy, mm, dd);
  const valid2000 = isValidDate(2000 + yy, mm, dd);
  if (!valid1900 && !valid2000) {
    return err(
      "INVALID_COMPONENT",
      "AMKA contains an invalid date",
    );
  }

  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "AMKA Luhn check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Greek AMKA. */
const generate = (): string => {
  for (;;) {
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const yy = String(randomInt(50, 99)).padStart(2, "0");
    const serial = randomDigits(4);
    const payload = dd + mm + yy + serial;
    const cs = luhnChecksum(payload + "0");
    const c = payload + String((10 - cs) % 10);
    if (validate(c).valid) return c;
  }
};

/** Greek Social Security Number. */
const amka: Validator = {
  name: "Greek Social Security Number",
  localName: "Αριθμός Μητρώου Κοινωνικής Ασφάλισης",
  abbreviation: "ΑΜΚΑ",
  aliases: [
    "ΑΜΚΑ",
    "Αριθμός Μητρώου Κοινωνικής Ασφάλισης",
    "AMKA",
  ] as const,
  candidatePattern: "\\d{11}",
  country: "GR",
  entityType: "person",
  sourceUrl: "https://www.amka.gr/",
  examples: ["01013099997"] as const,
  compact,
  format,
  validate,
  generate,
};

export default amka;
export { compact, format, validate, generate };

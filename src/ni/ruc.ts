/**
 * RUC (Registro Único de Contribuyente, Nicaragua
 * tax number).
 *
 * For natural persons the RUC is the cédula de
 * identidad: 14 characters structured as
 * MMM-DDMMYY-NNNNL where:
 *   - MMM  = municipality code (001–999)
 *   - DDMMYY = birth date
 *   - NNNN = sequential number
 *   - L = check letter (mod 23, ISO 7064)
 *
 * For legal entities (Personas Jurídicas) the RUC
 * starts with "J" followed by 13 digits. No public
 * check-digit algorithm is documented for the "J"
 * format, so validation is format-only.
 *
 * The check letter for natural persons uses modulo 23
 * with a 23-letter alphabet that excludes I, O, and Z
 * to avoid confusion with digits.
 *
 * @see https://www.dgi.gob.ni/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

/**
 * Check letter alphabet (mod 23). Excludes I, O, Z
 * to prevent transcription errors.
 */
const CHECK_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXY";

/**
 * Compact: strip spaces, hyphens, and uppercase.
 */
const compact = (value: string): string =>
  clean(value, " -").trim().toUpperCase();

/**
 * Validate a birth date encoded as DDMMYY.
 * Returns true if the date components are plausible.
 */
const isValidDate = (ddmmyy: string): boolean => {
  const day = Number(ddmmyy.slice(0, 2));
  const month = Number(ddmmyy.slice(2, 4));

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
};

/**
 * Calculate the check letter for a 13-digit body
 * using modulo 23.
 */
const calcCheckLetter = (body: string): string => {
  let n = 0n;
  for (const ch of body) {
    n = n * 10n + BigInt(ch);
  }
  const idx = Number(n % 23n);
  // SAFETY: idx is always 0–22 (mod 23), and
  // CHECK_ALPHABET has exactly 23 characters.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return CHECK_ALPHABET[idx]!;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 14) {
    return err(
      "INVALID_LENGTH",
      "Nicaragua RUC must be 14 characters",
    );
  }

  // Legal entity: starts with J + 13 digits
  if (v[0] === "J") {
    if (!isdigits(v.slice(1))) {
      return err(
        "INVALID_FORMAT",
        "Nicaragua legal entity RUC must be " +
          "J followed by 13 digits",
      );
    }
    return { valid: true, compact: v };
  }

  // Natural person: 13 digits + 1 letter
  const body = v.slice(0, 13);
  // SAFETY: length is validated as exactly 14 above.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const check = v[13]!;

  if (!isdigits(body)) {
    return err(
      "INVALID_FORMAT",
      "Nicaragua RUC body must contain only digits",
    );
  }

  if (!CHECK_ALPHABET.includes(check)) {
    return err(
      "INVALID_FORMAT",
      "Nicaragua RUC check letter is invalid",
    );
  }

  // Validate date portion (positions 3–8: DDMMYY)
  const datePart = body.slice(3, 9);
  if (!isValidDate(datePart)) {
    return err(
      "INVALID_COMPONENT",
      "Nicaragua RUC contains an invalid " +
        "birth date",
    );
  }

  // Verify check letter
  const expected = calcCheckLetter(body);
  if (check !== expected) {
    return err(
      "INVALID_CHECKSUM",
      "Nicaragua RUC check letter does not match",
    );
  }

  return { valid: true, compact: v };
};

/**
 * Format: insert hyphens as MMM-DDMMYY-NNNNL
 * for natural persons. Legal entities are returned
 * in compact form (JNNNNNNNNNNNNN); no documented
 * segmentation exists for the J-prefix format.
 */
const format = (value: string): string => {
  const v = compact(value);
  if (v[0] === "J") {
    return `J-${v.slice(1)}`;
  }
  return (
    `${v.slice(0, 3)}-${v.slice(3, 9)}` +
    `-${v.slice(9)}`
  );
};

/** Generate a random valid Nicaraguan RUC (legal entity). */
const generate = (): string => "J" + randomDigits(13);

/** Nicaragua tax identification number. */
const ruc: Validator = {
  name: "Tax Identification Number",
  localName: "Registro Único de Contribuyente",
  abbreviation: "RUC",
  aliases: ["RUC"] as const,
  candidatePattern: "[JKME]\\d{13}",
  country: "NI",
  entityType: "any",
  description:
    "Tax identifier issued by Nicaragua's DGI",
  sourceUrl: "https://www.dgi.gob.ni/",
  lengths: [14] as const,
  examples: [
    "6071904680001F",
    "2811505850012D",
  ] as const,
  compact,
  format,
  validate,
  generate,
};

export default ruc;
export { compact, format, validate, generate };

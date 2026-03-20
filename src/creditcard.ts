/**
 * Credit card number validation (Luhn algorithm).
 *
 * Validates card numbers using the Luhn checksum
 * (ISO/IEC 7812-1). Supports Visa, Mastercard,
 * Amex, Discover, and other networks (13-19
 * digits).
 */

import {
  luhnChecksum,
  luhnValidate,
} from "#checksums/luhn";
import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "./types";

/**
 * Card network identifiers returned by
 * {@link detectNetwork}.
 */
type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "maestro";

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 13 || v.length > 19) {
    return err(
      "INVALID_LENGTH",
      "Credit card number must be 13-19 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Credit card number must contain only digits",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Credit card number fails Luhn check",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  // Amex: 4-6-5 grouping
  if (v.length === 15 && v[0] === "3") {
    return `${v.slice(0, 4)} ${v.slice(4, 10)} ${v.slice(10)}`;
  }
  // Standard: groups of 4
  const groups: string[] = [];
  for (let i = 0; i < v.length; i += 4) {
    groups.push(v.slice(i, i + 4));
  }
  return groups.join(" ");
};

const MAESTRO_PREFIXES: readonly number[] = [
  5018, 5020, 5038, 5893, 6304, 6759, 6761,
  6762, 6763,
];

/**
 * Detect the card network from the BIN/IIN prefix.
 *
 * Accepts both formatted ("4111 1111 1111 1111")
 * and compact ("4111111111111111") inputs.
 * Returns null for unrecognized prefixes.
 */
const detectNetwork = (
  value: string,
): CardNetwork | null => {
  const v = compact(value);
  if (v.length === 0) return null;
  if (!isdigits(v)) return null;

  const d2 = Number(v.slice(0, 2));
  const d3 = Number(v.slice(0, 3));
  const d4 = Number(v.slice(0, 4));
  const d6 = Number(v.slice(0, 6));

  // Amex: 34, 37
  if (d2 === 34 || d2 === 37) return "amex";

  // Diners Club: 300-305, 36, 38
  if (d2 === 36 || d2 === 38) return "diners";
  if (d3 >= 300 && d3 <= 305) return "diners";

  // JCB: 3528-3589
  if (d4 >= 3528 && d4 <= 3589) return "jcb";

  // Visa: starts with 4
  if (v[0] === "4") return "visa";

  // Maestro (check before Mastercard; some share
  // the 50xx prefix space)
  if (MAESTRO_PREFIXES.includes(d4))
    return "maestro";

  // Mastercard: 51-55 or 2221-2720
  if (d2 >= 51 && d2 <= 55) return "mastercard";
  if (d4 >= 2221 && d4 <= 2720) return "mastercard";

  // Discover: 6011, 622126-622925, 644-649, 65
  if (d4 === 6011) return "discover";
  if (d6 >= 622126 && d6 <= 622925) return "discover";
  if (d3 >= 644 && d3 <= 649) return "discover";
  if (d2 === 65) return "discover";

  // UnionPay: starts with 62 (excluding Discover
  // ranges already matched above)
  if (d2 === 62) return "unionpay";

  return null;
};

/**
 * Visa/Mastercard IIN prefixes. Each entry is
 * [prefix, totalLength].
 */
const CARD_PREFIXES = [
  ["4", 16], // Visa
  ["51", 16], // Mastercard
  ["52", 16], // Mastercard
  ["53", 16], // Mastercard
  ["54", 16], // Mastercard
  ["55", 16], // Mastercard
] as const;

/**
 * Generate a random valid Visa or Mastercard
 * number (16 digits, Luhn-valid).
 */
const generate = (): string => {
  const idx = randomInt(0, CARD_PREFIXES.length - 1);
  const [prefix, length] = CARD_PREFIXES[idx] as
    (typeof CARD_PREFIXES)[number];
  const remaining = length - prefix.length - 1;
  const payload = `${prefix}${randomDigits(remaining)}`;
  const partial = `${payload}0`;
  const remainder = luhnChecksum(partial);
  const check = (10 - remainder) % 10;
  return `${payload}${String(check)}`;
};

/** Credit Card Number (Luhn). */
const creditCard: Validator = {
  name: "Credit Card Number",
  localName: "Credit Card Number",
  abbreviation: "CC",
  entityType: "any",
  examples: [
    "4111111111111111",
    "5500000000000004",
  ] as const,
  compact,
  format,
  validate,
  generate,
};

export default creditCard;
export { compact, detectNetwork, format, validate };
export type { CardNetwork };

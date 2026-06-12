/**
 * Ethereum address.
 *
 * Validates the canonical 0x-prefixed 20-byte
 * hexadecimal address shape. The compact form is
 * lowercased so checksummed and non-checksummed
 * variants of the same address compare equal.
 */

import type {
  GlobalValidator,
  ValidateResult,
} from "../types";

import { clean } from "#util/clean";
import { err } from "#util/result";

const ETH_ADDRESS_LENGTH = 42;

const compact = (value: string): string =>
  clean(value, " ").toLowerCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== ETH_ADDRESS_LENGTH) {
    return err(
      "INVALID_LENGTH",
      "Ethereum address must be 42 characters",
    );
  }
  if (!/^0x[0-9a-f]{40}$/.test(v)) {
    return err(
      "INVALID_FORMAT",
      "Ethereum address must be 0x followed by 40 hexadecimal characters",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

const eth: GlobalValidator = {
  scope: "global",
  name: "Ethereum Address",
  localName: "Ethereum Address",
  abbreviation: "ETH",
  aliases: [
    "Ethereum address",
    "EVM address",
    "crypto wallet",
  ] as const,
  candidatePattern: "0x[0-9A-Fa-f]{40}",
  entityType: "any",
  examples: [
    "0xde709f2102306220921060314715629080e2fb77",
  ] as const,
  lengths: [ETH_ADDRESS_LENGTH] as const,
  compact,
  format,
  validate,
};

export default eth;
export { compact, format, validate };

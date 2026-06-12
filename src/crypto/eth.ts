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

import { keccak256 } from "#checksums/keccak";
import { clean } from "#util/clean";
import { err } from "#util/result";

const ETH_ADDRESS_LENGTH = 42;
const HEX_PREFIX_LENGTH = 2;

const compact = (value: string): string =>
  clean(value, " ").toLowerCase();

const asciiBytes = (value: string): Uint8Array => {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) {
    bytes[i] = value.charCodeAt(i);
  }
  return bytes;
};

const hexBytes = (bytes: Uint8Array): string => {
  let result = "";
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, "0");
  }
  return result;
};

const isMixedCase = (value: string): boolean =>
  /[a-f]/.test(value) && /[A-F]/.test(value);

const hasValidEip55Checksum = (
  address: string,
): boolean => {
  const body = address.slice(HEX_PREFIX_LENGTH);
  if (!isMixedCase(body)) return true;

  const lower = body.toLowerCase();
  const hash = hexBytes(keccak256(asciiBytes(lower)));

  for (let i = 0; i < body.length; i += 1) {
    const ch = body.charAt(i);
    if (/\d/.test(ch)) continue;

    const nibble = Number.parseInt(hash.charAt(i), 16);
    const expected =
      nibble >= 8 ? ch.toUpperCase() : ch.toLowerCase();
    if (ch !== expected) return false;
  }

  return true;
};

const validate = (value: string): ValidateResult => {
  const raw = clean(value, " ");
  const v = raw.toLowerCase();
  if (v.length !== ETH_ADDRESS_LENGTH) {
    return err(
      "INVALID_LENGTH",
      "Ethereum address must be 42 characters",
    );
  }
  if (!/^0x[0-9a-f]{40}$/i.test(raw)) {
    return err(
      "INVALID_FORMAT",
      "Ethereum address must be 0x followed by 40 hexadecimal characters",
    );
  }
  if (!hasValidEip55Checksum(raw)) {
    return err(
      "INVALID_CHECKSUM",
      "Ethereum address fails EIP-55 checksum validation",
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
export { compact, format, hasValidEip55Checksum, validate };

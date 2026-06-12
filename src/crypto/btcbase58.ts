/**
 * Bitcoin Base58Check address.
 *
 * Validates legacy mainnet P2PKH and P2SH Bitcoin
 * addresses, including the double-SHA-256 checksum.
 */

import type {
  GlobalValidator,
  ValidateResult,
} from "../types";

import { sha256 } from "#checksums/sha256";
import { clean } from "#util/clean";
import { err } from "#util/result";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const MIN_LENGTH = 26;
const MAX_LENGTH = 35;
const DECODED_ADDRESS_LENGTH = 25;
const CHECKSUM_LENGTH = 4;
const MAINNET_P2PKH_VERSION = 0x00;
const MAINNET_P2SH_VERSION = 0x05;

const compact = (value: string): string =>
  clean(value, " ");

const decodeBase58 = (value: string): Uint8Array | null => {
  let decoded = 0n;
  for (const ch of value) {
    const digit = BASE58_ALPHABET.indexOf(ch);
    if (digit === -1) return null;
    decoded = decoded * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (decoded > 0n) {
    bytes.push(Number(decoded & 0xffn));
    decoded >>= 8n;
  }
  bytes.reverse();

  let leadingZeros = 0;
  while (value.charAt(leadingZeros) === "1") {
    leadingZeros += 1;
  }

  const result = new Uint8Array(
    leadingZeros + bytes.length,
  );
  result.set(bytes, leadingZeros);
  return result;
};

const hasValidChecksum = (decoded: Uint8Array): boolean => {
  if (decoded.length <= CHECKSUM_LENGTH) return false;

  const payload = decoded.slice(0, -CHECKSUM_LENGTH);
  const checksum = decoded.slice(-CHECKSUM_LENGTH);
  const digest = sha256(sha256(payload));

  for (let i = 0; i < CHECKSUM_LENGTH; i += 1) {
    if (checksum[i] !== digest[i]) return false;
  }
  return true;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < MIN_LENGTH || v.length > MAX_LENGTH) {
    return err(
      "INVALID_LENGTH",
      "Bitcoin Base58Check address must be 26-35 characters",
    );
  }
  if (!/^[13]/.test(v)) {
    return err(
      "INVALID_COMPONENT",
      "Bitcoin Base58Check address must start with 1 or 3",
    );
  }

  const decoded = decodeBase58(v);
  if (decoded === null) {
    return err(
      "INVALID_FORMAT",
      "Bitcoin Base58Check address contains invalid characters",
    );
  }
  if (decoded.length !== DECODED_ADDRESS_LENGTH) {
    return err(
      "INVALID_LENGTH",
      "Bitcoin Base58Check address decoded payload must be 25 bytes",
    );
  }

  const version = decoded[0];
  if (
    version !== MAINNET_P2PKH_VERSION &&
    version !== MAINNET_P2SH_VERSION
  ) {
    return err(
      "INVALID_COMPONENT",
      "Bitcoin Base58Check address has an unsupported version",
    );
  }

  if (!hasValidChecksum(decoded)) {
    return err(
      "INVALID_CHECKSUM",
      "Bitcoin Base58Check address fails checksum validation",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

const btcBase58: GlobalValidator = {
  scope: "global",
  name: "Bitcoin Base58Check Address",
  localName: "Bitcoin Base58Check Address",
  abbreviation: "BTC",
  aliases: [
    "Bitcoin address",
    "Bitcoin legacy address",
    "Base58Check address",
  ] as const,
  candidatePattern: "[13][1-9A-HJ-NP-Za-km-z]{25,34}",
  entityType: "any",
  examples: [
    "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  ] as const,
  compact,
  format,
  validate,
};

export default btcBase58;
export { compact, decodeBase58, format, validate };

/**
 * Bitcoin Bech32/Bech32m address.
 *
 * Validates mainnet SegWit addresses with the
 * Bech32 checksum for v0 and Bech32m for v1+.
 */

import type {
  GlobalValidator,
  ValidateResult,
} from "../types";

import { clean } from "#util/clean";
import { err } from "#util/result";

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATORS = [
  0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd,
  0x2a1462b3,
] as const;
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;
const CHECKSUM_LENGTH = 6;
const MIN_DATA_LENGTH = 11;
const MAX_DATA_LENGTH = 71;

const compact = (value: string): string =>
  clean(value, " ").toLowerCase();

const polymod = (values: readonly number[]): number => {
  let chk = 1;
  for (const value of values) {
    const top = chk >>> 25;
    chk = (((chk & 0x1ffffff) << 5) ^ value) >>> 0;
    for (let i = 0; i < GENERATORS.length; i += 1) {
      const generator = GENERATORS[i] ?? 0;
      if (((top >>> i) & 1) === 1) {
        chk = (chk ^ generator) >>> 0;
      }
    }
  }
  return chk >>> 0;
};

const hrpExpand = (hrp: string): number[] => {
  const expanded: number[] = [];
  for (const ch of hrp) {
    expanded.push(ch.charCodeAt(0) >>> 5);
  }
  expanded.push(0);
  for (const ch of hrp) {
    expanded.push(ch.charCodeAt(0) & 31);
  }
  return expanded;
};

const dataValues = (data: string): number[] | null => {
  const values: number[] = [];
  for (const ch of data) {
    const value = CHARSET.indexOf(ch);
    if (value === -1) return null;
    values.push(value);
  }
  return values;
};

const convertBits = (
  values: readonly number[],
  fromBits: number,
  toBits: number,
): number[] | null => {
  let accumulator = 0;
  let bits = 0;
  const maxValue = (1 << toBits) - 1;
  const result: number[] = [];

  for (const value of values) {
    if (value < 0 || value >>> fromBits !== 0) return null;
    accumulator = (accumulator << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((accumulator >>> bits) & maxValue);
    }
  }

  if (bits >= fromBits) return null;
  if (((accumulator << (toBits - bits)) & maxValue) !== 0) {
    return null;
  }

  return result;
};

type Bech32Validation =
  | { valid: true }
  | {
      valid: false;
      code: "format" | "checksum" | "component";
    };

const validateBech32 = (
  rawValue: string,
): Bech32Validation => {
  const hasLower = /[a-z]/.test(rawValue);
  const hasUpper = /[A-Z]/.test(rawValue);
  if (hasLower && hasUpper)
    return { valid: false, code: "format" };

  const v = rawValue.toLowerCase();
  if (!v.startsWith("bc1"))
    return { valid: false, code: "component" };

  const data = v.slice(3);
  if (
    data.length < MIN_DATA_LENGTH ||
    data.length > MAX_DATA_LENGTH
  ) {
    return { valid: false, code: "format" };
  }

  const values = dataValues(data);
  if (values === null)
    return { valid: false, code: "format" };

  const expanded = hrpExpand("bc");
  for (const value of values) {
    expanded.push(value);
  }
  const check = polymod(expanded);

  const version = values.at(0);
  if (version === undefined || version > 16) {
    return { valid: false, code: "component" };
  }

  if (version === 0 && check !== BECH32_CONST) {
    return { valid: false, code: "checksum" };
  }
  if (version > 0 && check !== BECH32M_CONST) {
    return { valid: false, code: "checksum" };
  }

  const programValues = values.slice(1, -CHECKSUM_LENGTH);
  const program = convertBits(programValues, 5, 8);
  if (
    program === null ||
    program.length < 2 ||
    program.length > 40
  ) {
    return { valid: false, code: "component" };
  }

  if (
    version === 0 &&
    program.length !== 20 &&
    program.length !== 32
  ) {
    return { valid: false, code: "component" };
  }

  return { valid: true };
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  const result = validateBech32(clean(value, " "));
  if (result.valid) return { valid: true, compact: v };

  if (result.code === "component") {
    return err(
      "INVALID_COMPONENT",
      "Bitcoin Bech32 address has an unsupported component",
    );
  }
  if (result.code === "checksum") {
    return err(
      "INVALID_CHECKSUM",
      "Bitcoin Bech32 address fails checksum validation",
    );
  }
  return err(
    "INVALID_FORMAT",
    "Bitcoin Bech32 address has an invalid format",
  );
};

const format = (value: string): string => compact(value);

const btcBech32: GlobalValidator = {
  scope: "global",
  name: "Bitcoin Bech32 Address",
  localName: "Bitcoin Bech32 Address",
  abbreviation: "BTC",
  aliases: [
    "Bitcoin address",
    "Bitcoin SegWit address",
    "Bech32 address",
    "Bech32m address",
  ] as const,
  candidatePattern:
    "(?:bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})",
  entityType: "any",
  examples: [
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
  ] as const,
  compact,
  format,
  validate,
};

export default btcBech32;
export {
  compact,
  convertBits,
  format,
  polymod,
  validate,
  validateBech32,
};

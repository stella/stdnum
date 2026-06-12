/**
 * Cryptocurrency wallet address.
 *
 * Convenience validator for supported wallet address
 * families. Use the specific validators when the
 * network or format must be known.
 */

import type {
  GlobalValidator,
  ValidateResult,
} from "../types";
import btcBase58 from "./btcbase58";
import btcBech32 from "./btcbech32";
import eth from "./eth";

const validators = [eth, btcBech32, btcBase58] as const;

const compact = (value: string): string => {
  for (const validator of validators) {
    const result = validator.validate(value);
    if (result.valid) return result.compact;
  }
  return value.trim();
};

const validate = (value: string): ValidateResult => {
  for (const validator of validators) {
    const result = validator.validate(value);
    if (result.valid) return result;
  }
  return {
    valid: false,
    error: {
      code: "INVALID_FORMAT",
      message: "Unsupported cryptocurrency wallet address",
    },
  };
};

const format = (value: string): string => compact(value);

const wallet: GlobalValidator = {
  scope: "global",
  name: "Cryptocurrency Wallet Address",
  localName: "Cryptocurrency Wallet Address",
  abbreviation: "crypto",
  aliases: [
    "crypto address",
    "wallet address",
    "cryptocurrency wallet",
  ] as const,
  candidatePattern:
    "(?:0x[0-9A-Fa-f]{40}|[13][1-9A-HJ-NP-Za-km-z]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})",
  entityType: "any",
  examples: [
    "0xde709f2102306220921060314715629080e2fb77",
    "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  ] as const,
  compact,
  format,
  validate,
};

export default wallet;
export { compact, format, validate };

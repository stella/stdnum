import type {
  CardNetwork,
  CountryCode,
  ErrorCode,
} from "./types";

export type NativeValidationError = {
  code: ErrorCode;
  message: string;
};
export type NativeValidateResult =
  | { valid: true; compact: string; error?: null }
  | {
      valid: false;
      compact?: null;
      error: NativeValidationError;
    };
export type NativeParsedIdentifier = {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender?: "male" | "female" | null;
};
export type ValidatorMetadata = {
  id: string;
  name: string;
  localName: string;
  abbreviation: string;
  description: string | null;
  aliases: readonly string[];
  candidatePattern: string | null;
  scope: "country" | "global";
  country: CountryCode | null;
  entityType: "person" | "company" | "any";
  sourceUrl: string | null;
  lengths: readonly number[];
  examples: readonly string[];
  canGenerate: boolean;
  canParse: boolean;
};

export type NativeStdnumBinding = {
  validatorIds(): string[];
  validators(): ValidatorMetadata[];
  validatorMetadata(id: string): ValidatorMetadata;
  validate(id: string, value: string): NativeValidateResult;
  validateIndex?(
    this: void,
    index: number,
    value: string,
  ): NativeValidateResult;
  validateFastIndex?(
    this: void,
    index: number,
    value: string,
  ): number | NativeValidationError;
  compact(id: string, value: string): string;
  compactIndex?(
    this: void,
    index: number,
    value: string,
  ): string;
  format(id: string, value: string): string;
  formatIndex?(
    this: void,
    index: number,
    value: string,
  ): string;
  generate(id: string): string | null;
  generateIndex?(this: void, index: number): string | null;
  luhnGenerate(length?: number): string;
  parse(
    id: string,
    value: string,
  ): NativeParsedIdentifier | null;
  parseIndex?(
    this: void,
    index: number,
    value: string,
  ): NativeParsedIdentifier | null;
  detectNetwork(value: string): CardNetwork | null;
  beNnChecksum(value: string): number | null;
  esVatCifChecksum(digits: string): number;
  eeIkTwoPassCheck(digits: string): number;
  gbNhsCalcCheckDigit(value: string): number | null;
  gbSedolCalcCheckDigit(value: string): string;
  hasValidEip55Checksum(value: string): boolean;
  decodeBase58(value: string): Uint8Array | null;
  convertBits(
    values: readonly number[],
    fromBits: number,
    toBits: number,
  ): number[] | null;
  polymod(values: readonly number[]): number;
  validateBech32(value: string):
    | { valid: true }
    | {
        valid: false;
        code: "format" | "checksum" | "component";
      };
};

const isObject = (
  value: unknown,
): value is Record<string, unknown> =>
  (typeof value === "object" && value !== null) ||
  typeof value === "function";

export const asNativeBinding = (
  value: unknown,
): NativeStdnumBinding | null => {
  const direct = nativeBindingCandidate(value);
  if (direct !== null) return direct;
  return isObject(value)
    ? nativeBindingCandidate(value["default"])
    : null;
};

const nativeBindingCandidate = (
  candidate: unknown,
): NativeStdnumBinding | null => {
  if (!isObject(candidate)) return null;
  const required = [
    "validatorIds",
    "validators",
    "validatorMetadata",
    "validate",
    "compact",
    "format",
    "generate",
    "parse",
  ];
  return required.every(
    (name) => typeof candidate[name] === "function",
  )
    ? (candidate as NativeStdnumBinding)
    : null;
};

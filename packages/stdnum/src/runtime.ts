import { registryMetadata } from "./generated/metadata";
import type {
  NativeParsedIdentifier,
  NativeStdnumBinding,
} from "./native";
import { loadNativeStdnumBinding } from "./native-node";
import type {
  ParsedIdentifier,
  ValidateResult,
  Validator,
} from "./types";

let bindingOverride: NativeStdnumBinding | undefined;
let nativeBinding: NativeStdnumBinding | undefined;
let bindingGeneration = 0;

export const setBinding = (
  binding: NativeStdnumBinding | undefined,
): void => {
  bindingOverride = binding;
  bindingGeneration += 1;
};

export const getBinding = (): NativeStdnumBinding => {
  if (bindingOverride !== undefined) return bindingOverride;
  nativeBinding ??= loadNativeStdnumBinding();
  return nativeBinding;
};

export const createValidator = <
  TValidator extends Validator,
>(
  id: string,
  index: number,
): TValidator => {
  const metadata = registryMetadata[index];
  if (metadata === undefined || metadata.id !== id)
    throw new Error(`Unknown stdnum validator: ${id}`);
  let cachedGeneration = -1;
  let cachedOperations: ValidatorOperations | undefined;
  const operations = (): ValidatorOperations => {
    if (
      cachedOperations === undefined ||
      cachedGeneration !== bindingGeneration
    ) {
      cachedOperations = bindOperations(
        getBinding(),
        id,
        index,
      );
      cachedGeneration = bindingGeneration;
    }
    return cachedOperations;
  };
  const validator: Record<string, unknown> = {
    name: metadata.name,
    localName: metadata.localName,
    abbreviation: metadata.abbreviation,
    aliases: metadata.aliases,
    candidatePattern: optional(metadata.candidatePattern),
    scope: metadata.scope,
    entityType: metadata.entityType,
    sourceUrl: metadata.sourceUrl ?? undefined,
    lengths:
      metadata.lengths.at(0) === undefined
        ? undefined
        : metadata.lengths,
    examples:
      metadata.examples.at(0) === undefined
        ? undefined
        : metadata.examples,
    compact: (value: string) => operations().compact(value),
    format: (value: string) => operations().format(value),
    validate: (value: string) =>
      operations().validate(value),
  };
  if (metadata.country !== null)
    validator["country"] = metadata.country;
  if (metadata.description !== null)
    validator["description"] = metadata.description;
  if (metadata.canGenerate) {
    validator["generate"] = (): string => {
      const value = operations().generate();
      if (value === null)
        throw new Error(
          `Validator ${id} cannot generate values`,
        );
      return value;
    };
  }
  if (metadata.parseKind !== null) {
    validator["parse"] = (
      value: string,
    ): ParsedIdentifier | null =>
      fromNativeParsed(operations().parse(value));
  }
  return validator as TValidator;
};

type ValidatorOperations = {
  compact(value: string): string;
  format(value: string): string;
  generate(): string | null;
  parse(value: string): NativeParsedIdentifier | null;
  validate(value: string): ValidateResult;
};

const bindOperations = (
  binding: NativeStdnumBinding,
  id: string,
  index: number,
): ValidatorOperations => {
  const compactIndex = binding.compactIndex;
  const formatIndex = binding.formatIndex;
  const generateIndex = binding.generateIndex;
  const parseIndex = binding.parseIndex;
  const validateFastIndex = binding.validateFastIndex;
  const compact =
    compactIndex === undefined
      ? (value: string) => binding.compact(id, value)
      : (value: string) => compactIndex(index, value);
  return {
    compact,
    format:
      formatIndex === undefined
        ? (value) => binding.format(id, value)
        : (value) => formatIndex(index, value),
    generate:
      generateIndex === undefined
        ? () => binding.generate(id)
        : () => generateIndex(index),
    parse:
      parseIndex === undefined
        ? (value) => binding.parse(id, value)
        : (value) => parseIndex(index, value),
    validate:
      validateFastIndex === undefined
        ? (value) =>
            publicResult(binding.validate(id, value))
        : (value) => {
            const result = validateFastIndex(index, value);
            if (typeof result !== "number")
              return { valid: false, error: result };
            return {
              valid: true,
              compact:
                result === 1 ? value : compact(value),
            };
          },
  };
};

const publicResult = (
  result: ReturnType<NativeStdnumBinding["validate"]>,
): ValidateResult =>
  result.valid
    ? { valid: true, compact: result.compact }
    : { valid: false, error: result.error };

const optional = <T>(value: T | null): T | undefined =>
  value ?? undefined;

const fromNativeParsed = (
  parsed: NativeParsedIdentifier | null,
): ParsedIdentifier | null => {
  if (parsed === null) return null;
  const birthDate = new Date(
    parsed.birthYear,
    parsed.birthMonth - 1,
    parsed.birthDay,
  );
  return parsed.gender === "male" ||
    parsed.gender === "female"
    ? { birthDate, gender: parsed.gender }
    : { birthDate };
};

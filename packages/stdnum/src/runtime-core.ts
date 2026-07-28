import { registryMetadata } from "./generated/metadata";
import type {
  NativeParsedIdentifier,
  NativeStdnumBinding,
} from "./native";
import type {
  ParsedIdentifier,
  ValidateResult,
  Validator,
} from "./types";

let bindingOverride: NativeStdnumBinding | undefined;
let nativeBinding: NativeStdnumBinding | undefined;
let bindingLoader: (() => NativeStdnumBinding) | undefined;
let bindingGeneration = 0;
const resetValidationBindings: (() => void)[] = [];

export const setBindingLoader = (
  loader: () => NativeStdnumBinding,
): void => {
  bindingLoader = loader;
  nativeBinding = undefined;
  bindingGeneration += 1;
  for (const reset of resetValidationBindings) reset();
};

export const setBinding = (
  binding: NativeStdnumBinding | undefined,
): void => {
  bindingOverride = binding;
  bindingGeneration += 1;
  for (const reset of resetValidationBindings) reset();
};

export const getBinding = (): NativeStdnumBinding => {
  if (bindingOverride !== undefined) return bindingOverride;
  nativeBinding ??= bindingLoader?.();
  if (nativeBinding === undefined)
    throw new Error(
      "stdnum runtime binding is not initialized",
    );
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
  const lazyValidate = (value: string): ValidateResult => {
    const validate = operations().validate;
    validator["validate"] = validate;
    return validate(value);
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
    validate: lazyValidate,
    validateMany: (values: readonly string[]) =>
      operations().validateMany(values),
  };
  resetValidationBindings.push(() => {
    validator["validate"] = lazyValidate;
  });
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
  compact(this: void, value: string): string;
  format(this: void, value: string): string;
  generate(this: void): string | null;
  parse(
    this: void,
    value: string,
  ): NativeParsedIdentifier | null;
  validate(this: void, value: string): ValidateResult;
  validateMany(
    this: void,
    values: readonly string[],
  ): ValidateResult[];
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
  const validateManyIndex = binding.validateManyIndex;
  const areAllCanonicalValidIndex =
    binding.areAllCanonicalValidIndex;
  const isValidCanonicalIndex =
    binding.isValidCanonicalIndex;
  const supportsCanonicalValidation =
    isValidCanonicalIndex !== undefined &&
    binding.supportsCanonicalValidationIndex?.(index) ===
      true;
  const compact =
    compactIndex === undefined
      ? (value: string) => binding.compact(id, value)
      : (value: string) => compactIndex(index, value);
  const validate = (): ValidatorOperations["validate"] => {
    if (supportsCanonicalValidation) {
      return (value) =>
        isValidCanonicalIndex(index, value)
          ? { valid: true, compact: value }
          : publicResult(
              binding.validateIndex === undefined
                ? binding.validate(id, value)
                : binding.validateIndex(index, value),
            );
    }
    if (validateFastIndex === undefined) {
      return (value) =>
        publicResult(binding.validate(id, value));
    }
    return (value) => {
      const result = validateFastIndex(index, value);
      if (typeof result !== "number")
        return { valid: false, error: result };
      return {
        valid: true,
        compact: result === 1 ? value : compact(value),
      };
    };
  };
  const validateMany =
    (): ValidatorOperations["validateMany"] => {
      if (validateManyIndex === undefined) {
        return (values) =>
          values.map((value) =>
            publicResult(binding.validate(id, value)),
          );
      }
      if (
        supportsCanonicalValidation &&
        areAllCanonicalValidIndex !== undefined
      ) {
        return (values) =>
          areAllCanonicalValidIndex(index, values)
            ? values.map((normalizedValue) => ({
                valid: true,
                compact: normalizedValue,
              }))
            : validateManyIndex(index, values).map(
                publicResult,
              );
      }
      return (values) =>
        validateManyIndex(index, values).map(publicResult);
    };
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
    validate: validate(),
    validateMany: validateMany(),
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

import { registryMetadata } from "./generated/metadata";
import type {
  NativeParsedIdentifier,
  NativeStdnumBinding,
} from "./native";
import { loadNativeStdnumBinding } from "./native-node";
import type { ParsedIdentifier, Validator } from "./types";

let bindingOverride: NativeStdnumBinding | undefined;
let nativeBinding: NativeStdnumBinding | undefined;

export const setBinding = (
  binding: NativeStdnumBinding | undefined,
): void => {
  bindingOverride = binding;
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
): TValidator => {
  const metadata = registryMetadata.find(
    (entry) => entry.id === id,
  );
  if (metadata === undefined)
    throw new Error(`Unknown stdnum validator: ${id}`);
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
    compact: (value: string) =>
      getBinding().compact(id, value),
    format: (value: string) =>
      getBinding().format(id, value),
    validate: (value: string) => {
      const result = getBinding().validate(id, value);
      return result.valid
        ? { valid: true as const, compact: result.compact }
        : { valid: false as const, error: result.error };
    },
  };
  if (metadata.country !== null)
    validator["country"] = metadata.country;
  if (metadata.description !== null)
    validator["description"] = metadata.description;
  if (metadata.canGenerate) {
    validator["generate"] = (): string => {
      const value = getBinding().generate(id);
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
      fromNativeParsed(getBinding().parse(id, value));
  }
  return validator as TValidator;
};

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

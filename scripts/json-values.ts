import { readFileSync } from "node:fs";

/** Narrows parsed JSON to a plain object. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

/** Follows object keys through parsed JSON; undefined when a step is absent. */
export const jsonPath = (
  value: unknown,
  ...keys: readonly string[]
): unknown => {
  let current = value;
  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
};

/** Reads a JSON file whose top level must be an object. */
export const readJsonRecord = (path: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRecord(parsed)) throw new Error(`${path} must contain a JSON object`);
  return parsed;
};

/** Reads `key` from a JSON object file, requiring it to be an object. */
export const readJsonRecordField = (
  path: string,
  key: string,
): Record<string, unknown> => {
  const value = readJsonRecord(path)[key];
  if (!isRecord(value)) throw new Error(`${path} must declare ${key}`);
  return value;
};

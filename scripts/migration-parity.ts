import { readFile } from "node:fs/promises";
/** Migration gate: compare the native Rust binding with the retained
 * pre-cutover TypeScript implementation across every public validator. */
import { createRequire } from "node:module";
import { join } from "node:path";

type ValidateResult =
  | { valid: true; compact: string }
  | {
      valid: false;
      error: { code: string; message: string };
    };
type Validator = {
  compact(value: string): string;
  format(value: string): string;
  generate?: () => string;
  validate(value: string): ValidateResult;
};
type RegistryEntry = {
  canGenerate: boolean;
  examples: string[];
  id: string;
  subpath: string;
};
type NativeBinding = {
  compact(id: string, value: string): string;
  format(id: string, value: string): string;
  generate(id: string): string | null;
  validate(id: string, value: string): ValidateResult;
};

const root = join(import.meta.dir, "..");
const require = createRequire(import.meta.url);
const binding = require(
  join(root, "packages/stdnum/index.cjs"),
) as NativeBinding;
const registry = JSON.parse(
  await readFile(
    join(root, "packages/stdnum/registry.json"),
    "utf8",
  ),
) as { validators: RegistryEntry[] };
let comparisons = 0;
const failures: string[] = [];

for (const entry of registry.validators) {
  const module = await import(
    join(root, "src", `${entry.subpath}.ts`)
  );
  const legacy = module.default as Validator;
  const samples = new Set<string>([
    "",
    "not-a-number",
    ...entry.examples,
  ]);
  for (const example of entry.examples) {
    samples.add(
      example.slice(0, Math.max(0, example.length - 1)),
    );
    samples.add(`${example}X`);
    samples.add(mutateLastCharacter(example));
    samples.add(legacy.format(example));
  }
  if (typeof legacy.generate === "function")
    samples.add(legacy.generate());
  if (entry.canGenerate) {
    const generated = binding.generate(entry.id);
    if (generated !== null) samples.add(generated);
  }

  for (const value of samples) {
    try {
      compareValue(
        entry.id,
        value,
        legacy,
        binding,
        failures,
      );
    } catch (error) {
      failures.push(
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
    comparisons += 1;
  }
}

if (failures.length > 0) {
  throw new Error(
    `Migration parity failed (${failures.length} disagreements):\n\n${failures.join("\n\n")}`,
  );
}

console.log(
  `Migration parity passed (${registry.validators.length} validators, ${comparisons} comparisons).`,
);

function mutateLastCharacter(value: string): string {
  if (value.length === 0) return "0";
  const last = value.at(-1) ?? "";
  let replacement = "0";
  if (last === "0") replacement = "1";
  else if (last === "A") replacement = "B";
  return `${value.slice(0, -1)}${replacement}`;
}

function compareValue(
  id: string,
  value: string,
  legacy: Validator,
  native: NativeBinding,
  disagreements: string[],
): void {
  const expected = legacy.validate(value);
  const actual = native.validate(id, value);
  if (actual.valid !== expected.valid) {
    recordFailure(
      disagreements,
      id,
      value,
      "valid",
      expected,
      actual,
    );
  }
  if (
    !actual.valid &&
    !expected.valid &&
    actual.error.code !== expected.error.code
  ) {
    recordFailure(
      disagreements,
      id,
      value,
      "error code",
      expected.error.code,
      actual.error.code,
    );
  }
  if (
    actual.valid &&
    expected.valid &&
    actual.compact !== expected.compact
  ) {
    recordFailure(
      disagreements,
      id,
      value,
      "validated compact",
      expected.compact,
      actual.compact,
    );
  }
  const expectedCompact = legacy.compact(value);
  const actualCompact = native.compact(id, value);
  if (actualCompact !== expectedCompact) {
    recordFailure(
      disagreements,
      id,
      value,
      "compact",
      expectedCompact,
      actualCompact,
    );
  }
  if (expected.valid) {
    const expectedFormat = legacy.format(value);
    const actualFormat = native.format(id, value);
    if (actualFormat !== expectedFormat) {
      recordFailure(
        disagreements,
        id,
        value,
        "format",
        expectedFormat,
        actualFormat,
      );
    }
  }
}

function recordFailure(
  disagreements: string[],
  id: string,
  value: string,
  operation: string,
  expected: unknown,
  actual: unknown,
): void {
  disagreements.push(
    `${id}: ${operation} parity failed for ${JSON.stringify(value)}\n` +
      `expected=${JSON.stringify(expected)}\nactual=${JSON.stringify(actual)}`,
  );
}

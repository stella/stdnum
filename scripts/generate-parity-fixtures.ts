/** One-time fixture bootstrap from the pre-cutover TypeScript implementation.
 * Future fixture refreshes must be produced by the Rust registry exporter. */
import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

type Registry = {
  validators: Array<{
    id: string;
    examples: string[];
    subpath: string;
  }>;
};

const root = join(import.meta.dir, "..");
const registry = JSON.parse(
  await readFile(
    join(root, "packages/stdnum/registry.json"),
    "utf8",
  ),
) as Registry;
const fixtures = [];

for (const entry of registry.validators) {
  const module = await import(
    join(root, "src", `${entry.subpath}.ts`)
  );
  const validator = module.default as {
    compact(value: string): string;
    format(value: string): string;
    validate(value: string): { valid: boolean };
  };
  for (const value of entry.examples) {
    fixtures.push({
      id: entry.id,
      value,
      expected: validator.validate(value).valid,
      compact: validator.compact(value),
      format: validator.format(value),
    });
  }
}

const path = join(
  root,
  "packages/stdnum/fixtures/parity.json",
);
await mkdir(dirname(path), { recursive: true });
await writeFile(
  path,
  `${JSON.stringify({ schemaVersion: 1, fixtures }, null, 2)}\n`,
);
console.log(`Wrote ${fixtures.length} parity fixtures.`);

/**
 * Generates the `exports` map in package.json from the filesystem.
 *
 * Scans `src/` for all `.ts` files, excluding internal modules
 * (`_util/`, `_checksums/`, `mod.ts`), and writes a sorted
 * exports map back into package.json.
 *
 * Usage:
 *   bun scripts/sync-exports.ts          # sync
 *   bun scripts/sync-exports.ts --check  # CI guard
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = import.meta.dir + "/..";
const SRC = join(ROOT, "src");
const PKG_PATH = join(ROOT, "package.json");

const isExcluded = (relPath: string): boolean => {
  if (relPath.startsWith("_util/")) return true;
  if (relPath.startsWith("_checksums/")) return true;

  const filename = relPath.split("/").at(-1)!;
  if (filename === "mod.ts") return true;
  if (filename === "index.ts") return true;
  if (filename === "types.ts") return true;

  return false;
};

const buildExportKey = (relPath: string): string => {
  // Remove .ts extension
  const withoutExt = relPath.replace(/\.ts$/, "");
  return `./${withoutExt}`;
};

type ConditionalExport = {
  types: string;
  import: string;
  default: string;
};

const buildExportValue = (
  relPath: string,
): ConditionalExport => {
  const withoutExt = relPath.replace(/\.ts$/, "");
  return {
    types: `./dist/${withoutExt}.d.ts`,
    import: `./dist/${withoutExt}.js`,
    default: `./dist/${withoutExt}.js`,
  };
};

const scanExports = async (): Promise<
  Record<string, ConditionalExport>
> => {
  const exports: Record<string, ConditionalExport> = {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      default: "./dist/index.js",
    },
    "./types": {
      types: "./dist/types.d.ts",
      import: "./dist/types.js",
      default: "./dist/types.js",
    },
  };

  const files = await readdir(SRC, { recursive: true });

  for (const file of files) {
    if (!file.endsWith(".ts")) continue;
    if (isExcluded(file)) continue;

    const key = buildExportKey(file);
    const value = buildExportValue(file);
    exports[key] = value;
  }

  return exports;
};

const sortExports = (
  exports: Record<string, ConditionalExport>,
): Record<string, ConditionalExport> => {
  const entries = Object.entries(exports);

  // Sort alphabetically, but keep "." first and
  // "./types" second
  const pinned = [".", "./types"];
  const pinnedEntries = pinned
    .filter((k) => exports[k] !== undefined)
    .map(
      (k) => [k, exports[k]] as [string, ConditionalExport],
    );

  const rest = entries
    .filter(([k]) => !pinned.includes(k))
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries([...pinnedEntries, ...rest]);
};

const isCheckMode = process.argv.includes("--check");

const main = async () => {
  const pkgText = await Bun.file(PKG_PATH).text();
  const pkg = JSON.parse(pkgText);

  const oldExports: Record<string, unknown> =
    pkg.exports ?? {};
  const newExports = sortExports(await scanExports());

  // Diff keys and values
  const oldKeys = new Set(Object.keys(oldExports));
  const newKeys = new Set(Object.keys(newExports));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      added.push(key);
    } else if (
      JSON.stringify(oldExports[key]) !==
      JSON.stringify(newExports[key])
    ) {
      changed.push(key);
    }
  }
  for (const key of oldKeys) {
    if (!newKeys.has(key)) removed.push(key);
  }

  // Also detect order changes (keys same but
  // different order in the JSON).
  const orderChanged =
    added.length === 0 &&
    removed.length === 0 &&
    changed.length === 0 &&
    JSON.stringify(oldExports) !==
      JSON.stringify(newExports);

  const hasChanges =
    added.length > 0 ||
    removed.length > 0 ||
    changed.length > 0 ||
    orderChanged;

  const total = Object.keys(newExports).length;

  if (!hasChanges) {
    console.log(`Exports: ${total} entries, no changes.`);
    return;
  }

  if (added.length > 0) {
    console.log(`\nAdded (${added.length}):`);
    for (const key of added) {
      console.log(`  + ${key}`);
    }
  }

  if (removed.length > 0) {
    console.log(`\nRemoved (${removed.length}):`);
    for (const key of removed) {
      console.log(`  - ${key}`);
    }
  }

  if (changed.length > 0) {
    console.log(`\nChanged (${changed.length}):`);
    for (const key of changed) {
      console.log(`  ~ ${key}`);
    }
  }

  if (orderChanged) {
    console.log("\nOrder changed (keys reordered).");
  }

  if (isCheckMode) {
    console.error(
      "\nExports map is out of sync." +
        " Run `bun run sync-exports` to fix.",
    );
    process.exit(1);
  }

  pkg.exports = newExports;

  await Bun.write(
    PKG_PATH,
    JSON.stringify(pkg, null, 2) + "\n",
  );

  console.log(`\nExports: ${total} entries written.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

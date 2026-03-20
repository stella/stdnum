/**
 * Generates the `exports` map in package.json from the filesystem.
 *
 * Scans `src/` for all `.ts` files, excluding internal modules
 * (`_util/`, `_checksums/`, `mod.ts`), and writes a sorted
 * exports map back into package.json.
 *
 * Usage: bun scripts/sync-exports.ts
 */

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

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

const buildExportValue = (relPath: string): string => {
  return `./src/${relPath}`;
};

const scanExports = async (): Promise<
  Record<string, string>
> => {
  const exports: Record<string, string> = {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
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
  exports: Record<string, string>,
): Record<string, string> => {
  const entries = Object.entries(exports);

  // Sort alphabetically, but keep "." first and "./types" second
  const pinned = [".","./types"];
  const pinnedEntries = pinned
    .filter((k) => exports[k] !== undefined)
    .map((k) => [k, exports[k]!] as const);

  const rest = entries
    .filter(([k]) => !pinned.includes(k))
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries([...pinnedEntries, ...rest]);
};

const main = async () => {
  const pkgText = await Bun.file(PKG_PATH).text();
  const pkg = JSON.parse(pkgText);

  const oldExports: Record<string, string> =
    pkg.exports ?? {};
  const newExports = sortExports(await scanExports());

  // Diff
  const oldKeys = new Set(Object.keys(oldExports));
  const newKeys = new Set(Object.keys(newExports));

  const added: string[] = [];
  const removed: string[] = [];

  for (const key of newKeys) {
    if (!oldKeys.has(key)) added.push(key);
  }
  for (const key of oldKeys) {
    if (!newKeys.has(key)) removed.push(key);
  }

  pkg.exports = newExports;

  await Bun.write(
    PKG_PATH,
    JSON.stringify(pkg, null, 2) + "\n",
  );

  const total = Object.keys(newExports).length;
  console.log(`Exports: ${total} entries written.`);

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

  if (added.length === 0 && removed.length === 0) {
    console.log("No changes to exports map.");
  }
};

main();

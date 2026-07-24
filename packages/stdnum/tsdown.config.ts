import { readdirSync } from "node:fs";
import type { Dirent } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "tsdown";

const collect = (directory: string): string[] => {
  const result: string[] = [];
  const directoryEntries = readdirSync(directory, {
    withFileTypes: true,
  }) as Dirent[];
  for (const entry of directoryEntries) {
    const name = String(entry.name);
    const path = join(directory, name);
    if (entry.isDirectory() === true)
      result.push(...collect(path));
    else if (
      entry.isFile() === true &&
      name.endsWith(".ts")
    )
      result.push(path);
  }
  return result;
};

const entries = Object.fromEntries([
  ...collect("src/generated").map((path) => [
    relative("src/generated", path).replace(/\.ts$/u, ""),
    path,
  ]),
  ["types", "src/types.ts"],
  ["catalog", "src/catalog.ts"],
  ["patterns", "src/patterns.ts"],
  ["native", "src/native.ts"],
  ["native-node", "src/native-node.ts"],
]);

export default defineConfig({
  entry: entries,
  format: ["esm"],
  unbundle: true,
  dts: true,
  clean: true,
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

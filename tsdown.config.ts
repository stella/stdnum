import { readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsdown";

const collectEntries = (dir: string): string[] => {
  const results: string[] = [];
  for (const entry of readdirSync(dir, {
    withFileTypes: true,
    recursive: true,
  })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".ts")) continue;
    if (entry.name.includes(".test.")) continue;
    const full = join(entry.parentPath, entry.name);
    results.push(full);
  }
  return results;
};

export default defineConfig({
  entry: collectEntries("src"),
  format: ["esm"],
  unbundle: true,
  dts: true,
  clean: true,
  // Keep .js/.d.ts outputs so package exports stay aligned after tsdown 0.21.
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

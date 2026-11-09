import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "tsdown";

const collect = (directory: string): string[] => {
  const result: string[] = [];
  const directoryEntries = readdirSync(directory, {
    withFileTypes: true,
  });
  for (const entry of directoryEntries) {
    const { name } = entry;
    const path = join(directory, name);
    if (entry.isDirectory()) result.push(...collect(path));
    else if (entry.isFile() && name.endsWith(".ts")) result.push(path);
  }
  return result;
};

// Entry name to source path; typed as pairs so `Object.fromEntries` keeps the
// value type instead of widening to `any`.
const entryPoints: Array<[string, string]> = [
  ...collect("src/generated").map((path): [string, string] => [
    relative("src/generated", path).replace(/\.ts$/u, ""),
    path,
  ]),
  ["types", "src/types.ts"],
  ["catalog", "src/catalog.ts"],
  ["patterns", "src/patterns.ts"],
  ["native", "src/native.ts"],
  ["native-node", "src/native-node.ts"],
  ["runtime", "src/runtime.ts"],
  ["runtime-browser", "src/runtime-browser.ts"],
  ["runtime-core", "src/runtime-core.ts"],
];
const entries = Object.fromEntries(entryPoints);

export default defineConfig({
  entry: entries,
  deps: {
    // index.cjs ships as-is: its literal `require` table is what lets
    // consumer bundlers resolve the platform addon; inlining it rewrites
    // those calls into a runtime helper they cannot see.
    neverBundle: ["#stdnum-runtime", "@stll/stdnum-wasm", /\/index\.cjs$/u],
  },
  format: ["esm"],
  unbundle: true,
  dts: { generator: "oxc" },
  clean: true,
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

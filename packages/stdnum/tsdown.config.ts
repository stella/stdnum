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
  ["runtime", "src/runtime.ts"],
  ["runtime-browser", "src/runtime-browser.ts"],
  ["runtime-core", "src/runtime-core.ts"],
]);

export default defineConfig({
  entry: entries,
  deps: {
    neverBundle: ["#stdnum-runtime"],
  },
  format: ["esm"],
  unbundle: true,
  dts: true,
  clean: true,
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

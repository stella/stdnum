import { readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsdown";

type DirectoryEntry = {
  isDirectory: () => boolean;
  isFile: () => boolean;
  name: string;
};

const collectEntries = (dir: string): string[] => {
  const results: string[] = [];

  const visit = (currentDir: string): void => {
    const entries: DirectoryEntry[] = readdirSync(
      currentDir,
      {
        withFileTypes: true,
      },
    );

    for (const entry of entries) {
      const full = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".ts")) continue;
      if (entry.name.includes(".test.")) continue;
      results.push(full);
    }
  };

  visit(dir);
  return results;
};

export default defineConfig({
  entry: collectEntries("src"),
  format: ["esm"],
  unbundle: true,
  dts: true,
  clean: true,
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

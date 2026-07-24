import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  fixedExtension: false,
  target: "es2022",
  outDir: "dist",
  sourcemap: true,
});

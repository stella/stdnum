import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { library } from "@stll/oxlint-config";
import {
  portableSafetyPluginSpecifiers,
  portableSafetyRules,
} from "@stll/oxlint-plugin";

import config from "../oxlint.config";
import { isRecord, isStringArray, jsonPath } from "./json-values";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const readJson = (path: string): unknown => JSON.parse(read(path));

test("uses shared library defaults and the complete portable safety pack", () => {
  expect(config).toEqual(
    library({
      jsPlugins: portableSafetyPluginSpecifiers,
      rules: portableSafetyRules,
    }),
  );
  for (const override of config.overrides ?? []) {
    for (const [rule, severity] of Object.entries(portableSafetyRules)) {
      expect(override.rules?.[rule]).toBe(severity);
    }
  }
  const tsconfig = readJson("tsconfig.json");
  expect(jsonPath(tsconfig, "extends")).toBe(
    "@stll/typescript-config/node.json",
  );
  expect(jsonPath(tsconfig, "compilerOptions")).toBeUndefined();
  for (const workspace of ["stdnum", "stdnum-wasm"]) {
    const compilerOptions = jsonPath(
      readJson(`packages/${workspace}/tsconfig.json`),
      "compilerOptions",
    );
    expect(
      Object.keys(isRecord(compilerOptions) ? compilerOptions : {}),
    ).toEqual(workspace === "stdnum" ? ["paths", "types"] : ["paths"]);
  }
});

test("declares runtime-only generated cloud setup with Rust checks", () => {
  const toolchain = readJson("stll-toolchain.json");
  expect(jsonPath(toolchain, "cloud", "install")).toBe(
    "bun install --frozen-lockfile",
  );
  expect(jsonPath(toolchain, "cloud", "rust", "components")).toEqual([
    "clippy",
    "rustfmt",
  ]);
  expect(jsonPath(toolchain, "cloud", "rust", "targets")).toEqual([
    "wasm32-unknown-unknown",
  ]);
  const script = read(".agents/cloud-setup.sh");
  expect(script).toContain("Generated");
  expect(script).toContain(read(".node-version").trim());
  expect(script).toContain("install --frozen-lockfile");
  expect(script).not.toContain(".env.cloud");
  const settings = readJson(".claude/settings.json");
  expect(jsonPath(settings, "hooks", "SessionStart")).toHaveLength(1);
});

test("keeps third-party quarantine and exact first-party tooling exemptions", () => {
  const bunfig: unknown = Bun.TOML.parse(read("bunfig.toml"));
  expect(jsonPath(bunfig, "install", "minimumReleaseAge")).toBe(432_000);
  const exceptions = jsonPath(bunfig, "install", "minimumReleaseAgeExcludes");
  if (!isStringArray(exceptions)) {
    throw new Error("bunfig.toml must list minimumReleaseAgeExcludes");
  }
  for (const name of [
    "@stll/oxlint-config",
    "@stll/oxlint-plugin",
    "@stll/typescript-config",
  ]) {
    expect(exceptions).toContain(name);
  }
  expect(exceptions.every((name) => !name.includes("*"))).toBe(true);
  // A third-party exclusion is temporary: it names when quarantine admits it.
  const lines = read("bunfig.toml").split("\n");
  for (const name of exceptions.filter((entry) => !entry.startsWith("@stll/")))
    expect(
      lines.some(
        (line) =>
          line.includes(`"${name}"`) && line.includes("# quarantine-expires:"),
      ),
    ).toBe(true);
});

test("updates each Ruby and PHP oracle dependency root", () => {
  const dependabot = read(".github/dependabot.yml");
  for (const [ecosystem, manifest] of [
    ["bundler", "Gemfile"],
    ["composer", "composer.json"],
  ]) {
    const roots = [
      ...new Bun.Glob(`**/${manifest}`).scanSync({
        onlyFiles: true,
      }),
    ]
      .filter((path) => !path.startsWith("node_modules/"))
      .map((path) => `/${path.slice(0, -manifest.length - 1)}`);
    expect(roots.length).toBeGreaterThan(0);
    const entry = dependabot
      .split(`  - package-ecosystem: ${ecosystem}\n`)
      .at(1)
      ?.split("  - package-ecosystem:")
      .at(0);
    expect(entry).toBeDefined();
    for (const root of roots) expect(entry).toContain(`directory: ${root}\n`);
  }
});

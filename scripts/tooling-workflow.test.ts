import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import toolchain from "@stll/oxlint-config/toolchain.json";

import { readJsonRecord, readJsonRecordField } from "./json-values";

const workflow = readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

const readPackageScripts = (): Record<string, unknown> =>
  readJsonRecordField("package.json", "scripts");

test("runs the shared tooling checks in the lint job", () => {
  const lint = workflow
    .split("  lint:\n")
    .at(1)
    ?.split("  version-sync:")
    .at(0);
  expect(lint).toContain("persist-credentials: false");
  expect(lint).toContain("bun run test:tooling");
  expect(lint).toContain("bun run check:toolchain");
  expect(lint).toContain("bun run lint");
  expect(lint).toContain("bun fmt --check");
});

test("replaces compiler-private Dylint with the pinned stable source checker", () => {
  expect(workflow).toContain("--rev 51a4412dfe02203c24a3495f14ec99405acb7527");
  expect(workflow).toContain("--locked stella_source_lint");
  expect(workflow).not.toContain("cargo-dylint");
  expect(workflow).not.toContain("dylint-link");
  expect(workflow).not.toContain("nightly-2026-04-16");
  const scripts = readPackageScripts();
  expect(scripts["rust:source-lint"]).toBe("cargo ci-stella-lint");
  expect(scripts["rust:check"]).toContain("bun run rust:source-lint");
  const cargoConfig = readFileSync(".cargo/config.toml", "utf8");
  expect(cargoConfig).toContain('ci-stella-lint = "stella-lint ."');
  expect(cargoConfig).not.toContain("ci-dylint");
});

test("keeps Hawk on the shared Rust toolchain", () => {
  expect(workflow).toContain(`HAWK_RUST_TOOLCHAIN: "${toolchain.rust}"`);
  expect(readPackageScripts()["rust:hawk"]).toContain(
    `cargo +${toolchain.rust} hawk check`,
  );
  expect(
    readJsonRecord("stll-toolchain.json")["rustExceptions"],
  ).toBeUndefined();
});

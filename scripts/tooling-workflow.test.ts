import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("uses committed history and shared detector to select workspace parity", () => {
  const lint = workflow
    .split("  lint:\n")
    .at(1)
    ?.split("  version-sync:")
    .at(0);
  expect(lint).toContain("fetch-depth: 0");
  expect(lint).toContain("persist-credentials: false");
  expect(lint).toContain('stll-toolchain-changed --since "$BASE_REF"');
  expect(lint).toContain(
    "github.event.pull_request.base.sha || github.event.before",
  );
  expect(lint).toContain("'unavailable-toolchain-base'");
  expect(lint).toContain("if: steps.toolchain.outputs.changed == 'true'");
  expect(lint).toContain("bun run test:tooling");
  expect(lint).toContain("bun run check:toolchain");
  expect(lint).toContain("bun run lint");
  expect(lint).toContain("bun run format:check");
});

test("replaces compiler-private Dylint with the pinned stable source checker", () => {
  expect(workflow).toContain("--rev 0ad75da354a5efff11626f59dcf8e07a0d0aea48");
  expect(workflow).toContain("--locked stella_source_lint");
  expect(workflow).not.toContain("cargo-dylint");
  expect(workflow).not.toContain("dylint-link");
  expect(workflow).not.toContain("nightly-2026-04-16");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  expect(packageJson.scripts["rust:source-lint"]).toBe("cargo ci-stella-lint");
  expect(packageJson.scripts["rust:check"]).toContain(
    "bun run rust:source-lint",
  );
  const cargoConfig = readFileSync(".cargo/config.toml", "utf8");
  expect(cargoConfig).toContain('ci-stella-lint = "stella-lint ."');
  expect(cargoConfig).not.toContain("ci-dylint");
});

test("keeps the Hawk install pin aligned with its authorized toolchain", () => {
  const configuration = JSON.parse(readFileSync("stll-toolchain.json", "utf8"));
  const installPins = [
    ...workflow.matchAll(
      /rustup toolchain install (\d+\.\d+\.\d+) --profile minimal/g,
    ),
  ].map((match) => match[1]);
  for (const { pin } of configuration.rustExceptions) {
    expect(installPins).toContain(pin);
    expect(workflow).toContain(`HAWK_RUST_TOOLCHAIN: "${pin}"`);
  }
});

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  ".github/workflows/release.yml",
  "utf8",
);
const byName = (left: string, right: string) =>
  left.localeCompare(right);

const expectedContract = {
  "python-wheel-aarch64-apple-darwin": [
    "macosx_11_0_arm64",
  ],
  "python-wheel-aarch64-unknown-linux-gnu": [
    "manylinux_2_17_aarch64",
    "manylinux2014_aarch64",
  ],
  "python-wheel-x86_64-apple-darwin": [
    "macosx_10_12_x86_64",
  ],
  "python-wheel-x86_64-pc-windows-msvc": ["win_amd64"],
  "python-wheel-x86_64-unknown-linux-gnu": [
    "manylinux_2_17_x86_64",
    "manylinux2014_x86_64",
  ],
};

const assertCallerContract = (source: string) => {
  expect(source).toContain(
    "expected-version: ${{ needs.verify.outputs.version }}",
  );
  expect(source).toContain("project-name: stella-stdnum");
  expect(source).toContain(
    "distribution-name: stella_stdnum",
  );

  const contract = source.match(
    /^          wheel-contract: >-\n            (\{.+\})$/m,
  );
  expect(contract).not.toBeNull();
  expect(JSON.parse(contract?.[1] ?? "{}")).toEqual(
    expectedContract,
  );

  const targets = [
    ...source.matchAll(
      /^          - target: ([a-z0-9_-]+)$/gm,
    ),
  ].map((match) => `python-wheel-${match[1]}`);
  expect(targets.toSorted(byName)).toEqual(
    Object.keys(expectedContract).toSorted(byName),
  );
};

test("binds the shared publisher to the exact stdnum wheel set", () => {
  assertCallerContract(workflow);
});

test.each([
  ["project-name: stella-stdnum", "project-name: other"],
  ["macosx_10_12_x86_64", "macosx_12_0_x86_64"],
  [
    '"python-wheel-x86_64-pc-windows-msvc":["win_amd64"]',
    '"python-wheel-x86_64-pc-windows-msvc":["win32"]',
  ],
])("rejects caller contract drift in %s", (from, to) => {
  const mutation = workflow.replace(from, to);
  expect(mutation).not.toBe(workflow);
  expect(() => assertCallerContract(mutation)).toThrow();
});

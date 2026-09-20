import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  ".github/workflows/release.yml",
  "utf8",
);
const byName = (left: string, right: string) =>
  left.localeCompare(right);

const parseJobs = (source: string) => {
  const marker = source.match(/^jobs:\n/m);
  expect(marker).not.toBeNull();
  const jobsSource = source.slice(
    (marker?.index ?? 0) + (marker?.[0].length ?? 0),
  );
  const matches = [
    ...jobsSource.matchAll(
      /^  ([A-Za-z_][A-Za-z0-9_-]*):\n/gm,
    ),
  ];
  return Object.fromEntries(
    matches.map((match, index) => [
      match[1],
      jobsSource.slice(
        match.index,
        matches.at(index + 1)?.index ?? jobsSource.length,
      ),
    ]),
  );
};

const jobs = parseJobs(workflow);

const finalizerPackageFiles = () => {
  const block = jobs["github-release"].match(
    /^      package-files: \|\n((?:        .+\n)+)/m,
  );
  expect(block).not.toBeNull();
  return (block?.[1] ?? "")
    .trim()
    .split("\n")
    .map((line) => line.trim());
};

describe("release workflow semantics", () => {
  test("finalizer package manifests equal the fixed release group and pack jobs", () => {
    const packageFiles = finalizerPackageFiles();
    const configuredPackages = JSON.parse(
      readFileSync(".changeset/config.json", "utf8"),
    ).fixed.at(0);
    const finalizedPackages = packageFiles.map(
      (packageFile) =>
        JSON.parse(readFileSync(packageFile, "utf8")).name,
    );
    expect(finalizedPackages.toSorted(byName)).toEqual(
      configuredPackages.toSorted(byName),
    );

    const nativePackageFiles = [
      ...jobs["pack-native"].matchAll(
        /^          - package: (.+)$/gm,
      ),
    ].map((match) => `packages/${match[1]}/package.json`);
    expect(
      [
        ...nativePackageFiles,
        "packages/stdnum/package.json",
        "packages/stdnum-wasm/package.json",
      ].toSorted(byName),
    ).toEqual(packageFiles.toSorted(byName));
  });

  test("caller binds finalization to its exact artifact set and credentials", () => {
    expect(jobs["github-release"]).toContain(
      "artifact-pattern: npm-tarball-*",
    );
    expect(jobs["github-release"]).toContain(
      "publish-to-npm: true",
    );
    const forwardedSecrets = [
      ...jobs["github-release"].matchAll(
        /^      ([A-Z][A-Z0-9_]+):\s+\$\{\{ secrets\.\1 \}\}$/gm,
      ),
    ].map((match) => match[1]);
    expect(forwardedSecrets.toSorted(byName)).toEqual([
      "RELEASE_APP_ID",
      "RELEASE_APP_PRIVATE_KEY",
    ]);
  });

  test("manual publishing and the root tarball fail closed", () => {
    expect(jobs.verify).toContain(
      "github.ref != 'refs/heads/main'",
    );
    expect(jobs["pack-portable"]).toContain(
      'pack.name !== "@stll/stdnum"',
    );
    expect(jobs["pack-portable"]).toContain(
      "pack.version !== process.env.EXPECTED_VERSION",
    );
    expect(jobs["pack-portable"]).toContain(
      'tar -xOf "$tarball" package/package.json',
    );
    expect(jobs["pack-portable"]).toContain(
      'manifest.name !== "@stll/stdnum"',
    );
  });
});

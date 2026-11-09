import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { isStringArray, readJsonRecord } from "./json-values";

const workflow = readFileSync(".github/workflows/release.yml", "utf8");
const byName = (left: string, right: string) => left.localeCompare(right);

const parseJobs = (source: string): ReadonlyMap<string, string> => {
  const marker = source.match(/^jobs:\n/m);
  expect(marker).not.toBeNull();
  const jobsSource = source.slice(
    (marker?.index ?? 0) + (marker?.[0].length ?? 0),
  );
  const matches = [...jobsSource.matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):\n/gm)];
  return new Map(
    matches.map((match, index): [string, string] => [
      match[1] ?? "",
      jobsSource.slice(
        match.index,
        matches.at(index + 1)?.index ?? jobsSource.length,
      ),
    ]),
  );
};

const jobs = parseJobs(workflow);

const job = (name: string): string => {
  const source = jobs.get(name);
  if (source === undefined) {
    throw new Error(`release workflow has no ${name} job`);
  }
  return source;
};

const fixedReleaseGroup = (): string[] => {
  const { fixed } = readJsonRecord(".changeset/config.json");
  const group: unknown = Array.isArray(fixed) ? fixed.at(0) : undefined;
  if (!isStringArray(group)) {
    throw new Error(".changeset/config.json must declare a fixed group");
  }
  return group;
};

const packageName = (packageFile: string): string => {
  const { name } = readJsonRecord(packageFile);
  if (typeof name !== "string") {
    throw new Error(`${packageFile} must declare a package name`);
  }
  return name;
};

const finalizerPackageFiles = () => {
  const block = job("github-release").match(
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
    const configuredPackages = fixedReleaseGroup();
    const finalizedPackages = packageFiles.map(packageName);
    expect(finalizedPackages.toSorted(byName)).toEqual(
      configuredPackages.toSorted(byName),
    );

    const nativePackageFiles = [
      ...job("pack-native").matchAll(/^          - package: (.+)$/gm),
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
    expect(job("github-release")).toContain("artifact-pattern: npm-tarball-*");
    expect(job("github-release")).toContain("publish-to-npm: true");
    const forwardedSecrets = [
      ...job("github-release").matchAll(
        /^      ([A-Z][A-Z0-9_]+):\s+\$\{\{ secrets\.\1 \}\}$/gm,
      ),
    ].map((match) => match[1]);
    expect(forwardedSecrets.toSorted(byName)).toEqual([
      "RELEASE_APP_ID",
      "RELEASE_APP_PRIVATE_KEY",
    ]);
  });

  test("manual publishing and the root tarball fail closed", () => {
    expect(job("verify")).toContain("github.ref != 'refs/heads/main'");
    expect(job("pack-portable")).toContain('pack.name !== "@stll/stdnum"');
    expect(job("pack-portable")).toContain(
      "pack.version !== process.env.EXPECTED_VERSION",
    );
    expect(job("pack-portable")).toContain(
      'tar -xOf "$tarball" package/package.json',
    );
    expect(job("pack-portable")).toContain('manifest.name !== "@stll/stdnum"');
  });
});

test("the release reconciler checks the packages the release publishes", () => {
  const reconcile = readFileSync(
    ".github/workflows/npm-release-reconcile.yml",
    "utf8",
  );
  const packageFiles = (source: string) =>
    [...source.matchAll(/package-files: \|\n((?: {8}\S.*\n)+)/gu)].map(
      (match) => match[1],
    );
  const [reconciled, ...extra] = packageFiles(reconcile);
  expect(reconciled).toBeDefined();
  expect(extra).toEqual([]);
  // The finalizer is the only release job that lists package manifests.
  expect(packageFiles(workflow)).toEqual([reconciled]);
  const pin = reconcile.match(
    /uses: stella\/\.github\/\.github\/workflows\/npm-release-reconcile\.yml@([0-9a-f]{40})\n/u,
  )?.[1];
  const finalizerPin = job("github-release").match(
    /uses: stella\/\.github\/\.github\/workflows\/npm-version-finalize\.yml@([0-9a-f]{40})\n/u,
  )?.[1];
  expect(pin).toBeDefined();
  expect(pin).toBe(finalizerPin);
  const releaseAppSecrets = (source: string) =>
    [
      ...source.matchAll(
        /^ {6}(RELEASE_APP_(?:ID|PRIVATE_KEY)): (\$\{\{ secrets\.[A-Z0-9_]+ \}\})$/gmu,
      ),
    ].map((match) => `${match[1]}=${match[2]}`);
  expect(releaseAppSecrets(reconcile)).toHaveLength(2);
  expect(releaseAppSecrets(reconcile)).toEqual(
    releaseAppSecrets(job("github-release")),
  );
});

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflowPath =
  process.env.RELEASE_WORKFLOW_PATH ??
  ".github/workflows/release.yml";
const workflow = readFileSync(workflowPath, "utf8");

const parseJobs = (source: string) => {
  const matches = [
    ...source.matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):\n/gm),
  ];
  return Object.fromEntries(
    matches.map((match, index) => {
      const next = matches.at(index + 1);
      return [
        match[1],
        source.slice(
          match.index,
          next?.index ?? source.length,
        ),
      ];
    }),
  );
};

const jobs = parseJobs(workflow);

const privilegedJobNames = Object.entries(jobs)
  .filter(([, job]) => /^      id-token: write$/m.test(job))
  .map(([name]) => name)
  .sort();

const packageOrBuildPattern =
  /actions\/checkout@|actions\/setup-node@|oven-sh\/setup-bun@|(?:bun|npm|pnpm|yarn) (?:ci|install)|npm pack|bun run (?:build|codegen)|cargo (?:build|install|package|test)/;

describe("release privilege boundary", () => {
  test("parses every valid GitHub Actions job identifier shape", () => {
    const parsed = parseJobs(
      "jobs:\n  a:\n    runs-on: ubuntu-latest\n  _publish:\n    runs-on: ubuntu-latest\n  publish_npm:\n    runs-on: ubuntu-latest\n  Publish-1:\n    runs-on: ubuntu-latest\n",
    );

    expect(Object.keys(parsed)).toEqual([
      "a",
      "_publish",
      "publish_npm",
      "Publish-1",
    ]);
  });

  test("OIDC jobs only consume prepared artifacts", () => {
    expect(privilegedJobNames).toEqual([
      "github-release",
      "publish-pypi",
    ]);

    for (const name of privilegedJobNames) {
      expect(jobs[name]).not.toMatch(packageOrBuildPattern);
    }
  });

  test("the hardened finalizer owns all npm publishing", () => {
    expect(jobs["publish-native"]).toBeUndefined();
    expect(jobs["publish-wasm"]).toBeUndefined();
    expect(jobs["publish-main"]).toBeUndefined();
    expect(jobs["pack-native"]).not.toContain(
      "id-token: write",
    );
    expect(jobs["pack-portable"]).not.toContain(
      "id-token: write",
    );
    expect(jobs["github-release"]).toContain(
      "npm-version-finalize.yml@1ce0079bbdbf93a4c1917d2857496b89aedcec14",
    );
    expect(jobs["github-release"]).toContain(
      "artifact-pattern: npm-tarball-*",
    );
    expect(jobs["github-release"]).not.toContain(
      "secrets: inherit",
    );
    expect(jobs["github-release"]).not.toContain(
      "pull-requests: write",
    );
    for (const secret of [
      "RELEASE_APP_ID",
      "RELEASE_APP_PRIVATE_KEY",
      "CHANGELOG_APP_ID",
      "CHANGELOG_APP_PRIVATE_KEY",
    ]) {
      expect(jobs["github-release"]).toContain(
        `${secret}:`,
      );
    }
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

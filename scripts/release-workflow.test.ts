import { YAML } from "bun";
import { describe, expect, test } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const workflowPath =
  process.env.RELEASE_WORKFLOW_PATH ??
  ".github/workflows/release.yml";
const workflow = readFileSync(workflowPath, "utf8");
const jobsMarker = workflow.indexOf("\njobs:\n");
expect(jobsMarker).not.toBe(-1);
const workflowPreamble = workflow.slice(0, jobsMarker);

const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");

const privilegedContract = (source: string) => {
  const parsed = YAML.parse(source);
  const writes = [
    ...Object.entries(parsed.permissions ?? {})
      .filter(([, access]) => access === "write")
      .map(([permission]) => `workflow:${permission}`),
    ...Object.entries(parsed.jobs).flatMap(
      ([jobName, job]) =>
        Object.entries(job.permissions ?? {})
          .filter(([, access]) => access === "write")
          .map(
            ([permission]) => `${jobName}:${permission}`,
          ),
    ),
  ].sort();
  return {
    jobs: {
      "github-release": fingerprint(
        parsed.jobs["github-release"],
      ),
      "publish-pypi": fingerprint(
        parsed.jobs["publish-pypi"],
      ),
    },
    writes,
  };
};

const assertPrivilegedContract = (source: string) => {
  assert.deepEqual(privilegedContract(source), {
    jobs: {
      "github-release":
        "1063a7c222b32f3597ceb64c19f35804f21db9a7cf5c09d53a215694e0190bed",
      "publish-pypi":
        "616df460cd1c840541fad8b522e98c461b09c9a095f065137adce66e83310f0e",
    },
    writes: [
      "github-release:contents",
      "github-release:id-token",
      "publish-pypi:id-token",
    ],
  });
};

const parseJobs = (source: string) => {
  const marker = source.match(/^jobs:\n/m);
  expect(marker).not.toBeNull();
  const jobsSource = source.slice(
    (marker?.index ?? 0) + (marker?.[0].length ?? 0),
  );
  const matches = [
    ...jobsSource.matchAll(
      /^  (?:(?:"([A-Za-z_][A-Za-z0-9_-]*)")|(?:'([A-Za-z_][A-Za-z0-9_-]*)')|([A-Za-z_][A-Za-z0-9_-]*)):\n/gm,
    ),
  ];
  return Object.fromEntries(
    matches.map((match, index) => {
      const next = matches.at(index + 1);
      return [
        match[1] ?? match[2] ?? match[3],
        jobsSource.slice(
          match.index,
          next?.index ?? jobsSource.length,
        ),
      ];
    }),
  );
};

const jobs = parseJobs(workflow);

const privilegedJobNames = Object.entries(jobs)
  .filter(([, job]) =>
    /^      id-token: write\s*(?:#.*)?$/m.test(job),
  )
  .map(([name]) => name)
  .sort();

describe("release privilege boundary", () => {
  test("fingerprints every complete privileged job and write permission", () => {
    assertPrivilegedContract(workflow);
  });

  test("rejects execution fields and unrelated write grants", () => {
    for (const mutation of [
      workflow.replace(
        "permissions:\n  contents: read",
        "permissions:\n  contents: write",
      ),
      workflow.replace(
        "pattern: python-wheel-*",
        "repository: attacker/repository\n          pattern: python-wheel-*",
      ),
      workflow.replace(
        "      - name: Verify exact wheel release set\n        env:",
        "      - name: Verify exact wheel release set\n        shell: bash -c 'echo unreviewed; {0}'\n        env:",
      ),
    ]) {
      expect(mutation).not.toBe(workflow);
      expect(() =>
        assertPrivilegedContract(mutation),
      ).toThrow();
    }
  });

  test("parses every valid GitHub Actions job identifier shape", () => {
    const parsed = parseJobs(
      "jobs:\n  a:\n    runs-on: ubuntu-latest\n  _publish:\n    runs-on: ubuntu-latest\n  publish_npm:\n    runs-on: ubuntu-latest\n  Publish-1:\n    runs-on: ubuntu-latest\n  '_quoted':\n    runs-on: ubuntu-latest\n",
    );

    expect(Object.keys(parsed)).toEqual([
      "a",
      "_publish",
      "publish_npm",
      "Publish-1",
      "_quoted",
    ]);
  });

  test("OIDC jobs only consume prepared artifacts", () => {
    expect(privilegedJobNames).toEqual([
      "github-release",
      "publish-pypi",
    ]);

    expect(workflowPreamble).toContain(
      "permissions:\n  contents: read",
    );
    expect(workflowPreamble).not.toContain(
      "id-token: write",
    );

    const publishPyPI = jobs["publish-pypi"];
    const actionRefs = [
      ...publishPyPI.matchAll(
        /^\s+(?:-\s+)?uses:\s+(\S+)/gm,
      ),
    ].map((match) => match[1]);
    expect(actionRefs).toEqual([
      "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
      "pypa/gh-action-pypi-publish@dc37677b2e1c63e2034f94d8a5b11f265b73ba33",
    ]);
    expect([
      ...publishPyPI.matchAll(/^\s+run:\s*[|>]?(?:\s*)$/gm),
    ]).toHaveLength(1);
    expect(publishPyPI).toContain(
      "Verify exact wheel release set",
    );
    expect(publishPyPI).toContain(
      "if found_platforms != set(expected_platforms)",
    );
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
    const expectedSecrets = [
      "RELEASE_APP_ID",
      "RELEASE_APP_PRIVATE_KEY",
      "CHANGELOG_APP_ID",
      "CHANGELOG_APP_PRIVATE_KEY",
    ].sort();
    for (const secret of expectedSecrets) {
      expect(jobs["github-release"]).toContain(
        `${secret}:`,
      );
    }
    const forwardedSecrets = [
      ...jobs["github-release"].matchAll(
        /^      ([A-Z][A-Z0-9_]+):\s+\$\{\{ secrets\.\1 \}\}$/gm,
      ),
    ]
      .map((match) => match[1])
      .sort();
    expect(forwardedSecrets).toEqual(expectedSecrets);
  });

  test("binds PyPI publication to the exact wheel identities", () => {
    const publishPyPI = jobs["publish-pypi"];

    expect(publishPyPI).toContain(
      "EXPECTED_VERSION: ${{ needs.verify.outputs.version }}",
    );
    expect(publishPyPI).toContain(
      'distribution != "stella_stdnum"',
    );
    expect(publishPyPI).toContain(
      'metadata["Version"] != expected_version',
    );
    expect(publishPyPI).toContain(
      'python_tag != "cp311" or abi_tag != "abi3"',
    );
    for (const platform of [
      "linux-aarch64",
      "linux-x86_64",
      "macos-arm64",
      "macos-x86_64",
      "windows-x86_64",
    ]) {
      expect(publishPyPI).toContain(`"${platform}":`);
    }
    expect(
      readFileSync(
        "scripts/pypi-wheel-set.test.ts",
        "utf8",
      ),
    ).toContain("accepts the exact five-wheel release set");
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

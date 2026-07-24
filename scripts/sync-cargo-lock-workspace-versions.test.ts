import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  syncCargoLockContents,
  WORKSPACE_PACKAGE_NAMES,
} from "./sync-cargo-lock-workspace-versions.mjs";

const originalLock = readFileSync("Cargo.lock", "utf8");
const originalVersion = readFileSync(
  "VERSION",
  "utf8",
).trim();
const [major, minor, patch] = originalVersion.split(".");
const nextVersion = `${major}.${minor}.${Number(patch) + 1}`;

describe("Cargo workspace lock version sync", () => {
  test("updates exactly the expected workspace packages", () => {
    const updatedLock = syncCargoLockContents(
      originalLock,
      nextVersion,
    );

    for (const packageName of WORKSPACE_PACKAGE_NAMES) {
      expect(updatedLock).toContain(
        `[[package]]\nname = "${packageName}"\nversion = "${nextVersion}"`,
      );
    }

    let expectedLock = originalLock;
    for (const packageName of WORKSPACE_PACKAGE_NAMES) {
      expectedLock = expectedLock.replace(
        `[[package]]\nname = "${packageName}"\nversion = "${originalVersion}"`,
        `[[package]]\nname = "${packageName}"\nversion = "${nextVersion}"`,
      );
    }
    expect(updatedLock).toBe(expectedLock);
  });

  test("round-trips byte-identically", () => {
    const updatedLock = syncCargoLockContents(
      originalLock,
      nextVersion,
    );
    expect(
      syncCargoLockContents(updatedLock, originalVersion),
    ).toBe(originalLock);
  });

  test("rejects a missing or duplicate workspace package entry", () => {
    const coreEntry = `[[package]]\nname = "stella-stdnum-core"\nversion = "${originalVersion}"`;
    expect(() =>
      syncCargoLockContents(
        originalLock.replace(coreEntry, ""),
        nextVersion,
      ),
    ).toThrow("found 0");
    expect(() =>
      syncCargoLockContents(
        `${originalLock}\n${coreEntry}\n`,
        nextVersion,
      ),
    ).toThrow("found 2");
  });
});

/**
 * The loader had no tests, which is how a real failure stayed invisible: the
 * platform binaries are optionalDependencies, so an installer that declines
 * them leaves this package importable and dead, throwing only on first use.
 * The message that surfaced then said "supported targets: …, linux-x64-gnu,
 * …" while failing ON linux-x64-gnu, which points the reader at a
 * portability problem that does not exist.
 *
 * Every input the loader consults is injectable, so both branches are
 * testable without touching the filesystem or the real platform.
 */

import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

import type { NativeStdnumBinding } from "../native";
import {
  loadNativeStdnumBinding,
  NATIVE_BINDING_TARGETS,
} from "../native-node";

/** Nothing resolves: the shape an install with no platform package has. */
const requireNothing = (specifier: string): unknown => {
  throw new Error(`Cannot find module '${specifier}'`);
};

describe("loadNativeStdnumBinding", () => {
  test("names the uninstalled package when the platform IS a build target", () => {
    expect(() =>
      loadNativeStdnumBinding({
        platform: "linux",
        arch: "x64",
        libc: "gnu",
        env: {},
        requireModule: requireNothing,
      }),
    ).toThrow(/@stll\/stdnum-linux-x64-gnu/u);
  });

  test("says the target exists rather than blaming the platform", () => {
    let message = "";
    try {
      loadNativeStdnumBinding({
        platform: "darwin",
        arch: "arm64",
        env: {},
        requireModule: requireNothing,
      });
    } catch (error) {
      message =
        error instanceof Error
          ? error.message
          : String(error);
    }

    expect(message).toContain("IS a build target");
    expect(message).toContain("optionalDependency");
    // The old message listed every supported target and nothing else, which
    // read as "your platform is unsupported" for a platform that is.
    expect(message).not.toMatch(
      /^Unable to load native stdnum binding.*supported targets/u,
    );
  });

  test("reports an unsupported platform as unsupported", () => {
    let message = "";
    try {
      loadNativeStdnumBinding({
        platform: "linux",
        arch: "x64",
        libc: "musl",
        env: {},
        requireModule: requireNothing,
      });
    } catch (error) {
      message =
        error instanceof Error
          ? error.message
          : String(error);
    }

    expect(message).toContain(
      "not among the build targets",
    );
    expect(message).toContain("linux-x64-musl");
  });

  test("prefers an explicit library path over the platform package", () => {
    // Every member the binding contract requires; a partial object is
    // rejected as "does not match the stdnum binding contract".
    const binding = new Proxy(
      {},
      { get: () => () => undefined },
    ) as NativeStdnumBinding;
    const loaded = loadNativeStdnumBinding({
      platform: "linux",
      arch: "x64",
      libc: "gnu",
      env: {
        STELLA_STDNUM_NATIVE_LIBRARY_PATH:
          "/tmp/custom.node",
      },
      requireModule: (specifier) => {
        if (specifier === "/tmp/custom.node")
          return binding;
        throw new Error(
          `Cannot find module '${specifier}'`,
        );
      },
    });

    expect(loaded).toBe(binding);
  });
});

describe("injected requireModule", () => {
  test("invokes the loader that ../index.cjs exports", () => {
    const binding = new Proxy(
      {},
      { get: () => () => undefined },
    ) as NativeStdnumBinding;
    const loaded = loadNativeStdnumBinding({
      platform: "linux",
      arch: "x64",
      libc: "gnu",
      env: {},
      requireModule: (specifier) => {
        if (specifier === "../index.cjs")
          return { loadNativeBinding: () => binding };
        throw new Error(
          `Cannot find module '${specifier}'`,
        );
      },
    });

    expect(loaded).toBe(binding);
  });
});

describe("index.cjs static loader", () => {
  test("names every build target as a literal require", async () => {
    // Bundlers only see literal specifiers, so a target missing from the
    // table loads in a plain install and fails inside a compiled bundle.
    const source = await readFile(
      new URL("../../index.cjs", import.meta.url),
      "utf8",
    );
    for (const [
      ,
      ,
      ,
      packageName,
    ] of NATIVE_BINDING_TARGETS) {
      expect(source).toContain(`require("${packageName}")`);
    }
  });
});

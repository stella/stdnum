import { createRequire } from "node:module";
import process from "node:process";

import { loadNativeBinding } from "../index.cjs";
import {
  asNativeBinding,
  type NativeStdnumBinding,
} from "./native";

export type NativeLibc = "gnu" | "musl";
export type LoadNativeBindingOptions = {
  platform?: string;
  arch?: string;
  libc?: NativeLibc;
  env?: Record<string, string | undefined>;
  requireModule?: (specifier: string) => unknown;
};

export const NATIVE_BINDING_TARGETS = [
  [
    "darwin",
    "arm64",
    undefined,
    "@stll/stdnum-darwin-arm64",
  ],
  ["darwin", "x64", undefined, "@stll/stdnum-darwin-x64"],
  ["linux", "arm64", "gnu", "@stll/stdnum-linux-arm64-gnu"],
  ["linux", "x64", "gnu", "@stll/stdnum-linux-x64-gnu"],
  [
    "win32",
    "x64",
    undefined,
    "@stll/stdnum-win32-x64-msvc",
  ],
] as const;

export const loadNativeStdnumBinding = (
  options: LoadNativeBindingOptions = {},
): NativeStdnumBinding => {
  const platform = options.platform ?? process.platform;
  const arch = options.arch ?? process.arch;
  const libc = options.libc ?? detectLibc(platform);
  const requireModule =
    options.requireModule ?? createRequire(import.meta.url);
  const match = NATIVE_BINDING_TARGETS.find(
    ([targetPlatform, targetArch, targetLibc]) =>
      targetPlatform === platform &&
      targetArch === arch &&
      (targetLibc === undefined || targetLibc === libc),
  );
  // The host platform loads through index.cjs, whose specifiers are string
  // literals so bundlers resolve the addon at build time and ship it as a
  // sidecar. A computed specifier (the injectable path below) is invisible to
  // them, so a `bun build --compile` binary would import fine and throw here.
  const useStaticLoader =
    options.requireModule === undefined &&
    match !== undefined &&
    isHostTarget({ platform, arch, libc });
  const libraryPath =
    options.env?.["STELLA_STDNUM_NATIVE_LIBRARY_PATH"] ??
    process.env["STELLA_STDNUM_NATIVE_LIBRARY_PATH"];
  const candidates: Array<[string, () => unknown]> = [];
  if (libraryPath !== undefined) {
    candidates.push([
      libraryPath,
      () => requireModule(libraryPath),
    ]);
  }
  if (useStaticLoader) {
    candidates.push(["../index.cjs", loadNativeBinding]);
  } else {
    candidates.push([
      "../index.cjs",
      () => requireModule("../index.cjs"),
    ]);
    if (match !== undefined) {
      candidates.push([
        match[3],
        () => requireModule(match[3]),
      ]);
    }
  }
  const errors: string[] = [];
  for (const [specifier, load] of candidates) {
    try {
      const binding = asNativeBinding(load());
      if (binding !== null) return binding;
      errors.push(
        `${specifier}: module does not match the stdnum binding contract`,
      );
    } catch (error) {
      errors.push(
        `${specifier}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const current = [platform, arch, libc]
    .filter(Boolean)
    .join("-");
  const supported = NATIVE_BINDING_TARGETS.map(
    ([p, a, l]) => [p, a, l].filter(Boolean).join("-"),
  ).join(", ");

  // Distinguish "we do not build for this platform" from "we do, but the
  // package holding the binary is not installed". They read identically in a
  // stack trace and have completely different fixes, and the second is the
  // common one: the platform packages are optionalDependencies, so anything
  // that declines to install them — `--no-optional`, an install-time version
  // gate such as a release-age policy, a partial lockfile — leaves this
  // package importable and non-functional, with no error until first use.
  const reason =
    match === undefined
      ? `This platform is not among the build targets (${supported}).`
      : `This platform IS a build target, so ${match[3]} exists but was not ` +
        `installed. It is an optionalDependency: check that optional ` +
        `dependencies are enabled, that ${match[3]} is not excluded by an ` +
        `install policy, and that it appears in your lockfile.`;

  throw new Error(
    `Unable to load the native stdnum binding for ${current}. ${reason}\n` +
      `Tried:\n${errors.map((line) => `  ${line}`).join("\n")}`,
  );
};

const isHostTarget = ({
  platform,
  arch,
  libc,
}: {
  platform: string;
  arch: string;
  libc: NativeLibc | undefined;
}): boolean =>
  platform === process.platform &&
  arch === process.arch &&
  (platform !== "linux" || libc === detectLibc(platform));

const detectLibc = (
  platform: string,
): NativeLibc | undefined => {
  if (platform !== "linux") return undefined;
  const { header } = process.report.getReport() as {
    header: { glibcVersionRuntime?: unknown };
  };
  return typeof header.glibcVersionRuntime === "string"
    ? "gnu"
    : "musl";
};

export * from "./native";

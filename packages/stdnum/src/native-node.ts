import { createRequire } from "node:module";
import process from "node:process";

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

const targets = [
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
  const match = targets.find(
    ([targetPlatform, targetArch, targetLibc]) =>
      targetPlatform === platform &&
      targetArch === arch &&
      (targetLibc === undefined || targetLibc === libc),
  );
  const candidates = [
    options.env?.["STELLA_STDNUM_NATIVE_LIBRARY_PATH"] ??
      process.env["STELLA_STDNUM_NATIVE_LIBRARY_PATH"],
    "../index.cjs",
    match?.[3],
  ].filter((value): value is string => value !== undefined);
  const errors: string[] = [];
  for (const specifier of candidates) {
    try {
      const binding = asNativeBinding(
        requireModule(specifier),
      );
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
  const supported = targets
    .map(([p, a, l]) => [p, a, l].filter(Boolean).join("-"))
    .join(", ");
  throw new Error(
    `Unable to load native stdnum binding for ${[platform, arch, libc].filter(Boolean).join("-")}; ` +
      `supported targets: ${supported}.\n${errors.join("\n")}`,
  );
};

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

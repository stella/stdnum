"use strict";

// Every specifier in this file is a string literal, and every `require` sits
// directly inside a `try` block, on purpose. Bundlers (Bun, esbuild) resolve
// literal requires at build time and ship the matching `.node` addon as a
// sidecar asset; a specifier computed at runtime is invisible to them, so the
// bundle imports cleanly and throws on first use. The `try` is what lets a
// bundler tolerate the platform packages that are not installed on the build
// host. src/native-node.ts keeps `NATIVE_BINDING_TARGETS` in sync with this
// table (guarded by test).

// Mirrors detectLibc in src/native-node.ts; only glibc builds are published.
const isGlibc = () =>
  typeof process.report.getReport().header
    .glibcVersionRuntime === "string";

const platformLoadError = (packageName, cause) =>
  new Error(
    `${packageName}: ${cause instanceof Error ? cause.message : String(cause)}`,
  );

const requirePlatformPackage = () => {
  if (
    process.platform === "darwin" &&
    process.arch === "arm64"
  ) {
    try {
      return require("@stll/stdnum-darwin-arm64");
    } catch (cause) {
      throw platformLoadError(
        "@stll/stdnum-darwin-arm64",
        cause,
      );
    }
  }
  if (
    process.platform === "darwin" &&
    process.arch === "x64"
  ) {
    try {
      return require("@stll/stdnum-darwin-x64");
    } catch (cause) {
      throw platformLoadError(
        "@stll/stdnum-darwin-x64",
        cause,
      );
    }
  }
  if (
    process.platform === "linux" &&
    process.arch === "arm64" &&
    isGlibc()
  ) {
    try {
      return require("@stll/stdnum-linux-arm64-gnu");
    } catch (cause) {
      throw platformLoadError(
        "@stll/stdnum-linux-arm64-gnu",
        cause,
      );
    }
  }
  if (
    process.platform === "linux" &&
    process.arch === "x64" &&
    isGlibc()
  ) {
    try {
      return require("@stll/stdnum-linux-x64-gnu");
    } catch (cause) {
      throw platformLoadError(
        "@stll/stdnum-linux-x64-gnu",
        cause,
      );
    }
  }
  if (
    process.platform === "win32" &&
    process.arch === "x64"
  ) {
    try {
      return require("@stll/stdnum-win32-x64-msvc");
    } catch (cause) {
      throw platformLoadError(
        "@stll/stdnum-win32-x64-msvc",
        cause,
      );
    }
  }
  throw new Error(
    `No native stdnum binding is published for ${process.platform}-${process.arch}`,
  );
};

/**
 * Load the host platform's native binding: the sidecar built next to this
 * file by scripts/build-native-node.mjs first, then the published platform
 * package.
 */
exports.loadNativeBinding = () => {
  let sidecarError;
  try {
    return require("./stella_stdnum_napi.node");
  } catch (error) {
    sidecarError = error;
  }
  try {
    return requirePlatformPackage();
  } catch (error) {
    const describe = (cause) =>
      cause instanceof Error
        ? cause.message
        : String(cause);
    throw new Error(
      `./stella_stdnum_napi.node: ${describe(sidecarError)}\n` +
        `platform package: ${describe(error)}`,
    );
  }
};

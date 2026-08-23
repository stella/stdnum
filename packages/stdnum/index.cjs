"use strict";

// Every specifier in this file is a string literal on purpose. Bundlers (Bun
// `--compile`, esbuild) resolve literal requires at build time and ship the
// matching `.node` addon as a sidecar asset; a specifier computed at runtime is
// invisible to them, so the bundle imports cleanly and throws on first use.
// src/native-node.ts keeps `targets` in sync with this table (guarded by test).

const requirePlatformPackage = () => {
  if (
    process.platform === "darwin" &&
    process.arch === "arm64"
  ) {
    return require("@stll/stdnum-darwin-arm64");
  }
  if (
    process.platform === "darwin" &&
    process.arch === "x64"
  ) {
    return require("@stll/stdnum-darwin-x64");
  }
  if (
    process.platform === "linux" &&
    process.arch === "arm64"
  ) {
    return require("@stll/stdnum-linux-arm64-gnu");
  }
  if (
    process.platform === "linux" &&
    process.arch === "x64"
  ) {
    return require("@stll/stdnum-linux-x64-gnu");
  }
  if (
    process.platform === "win32" &&
    process.arch === "x64"
  ) {
    return require("@stll/stdnum-win32-x64-msvc");
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

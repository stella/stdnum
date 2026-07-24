export const CHANGESET_RE =
  /^\.changeset\/(?!README\.md$)[^/]+\.md$/;

export const RUNTIME_MANIFESTS = new Set([
  "packages/stdnum/package.json",
  "packages/stdnum-wasm/package.json",
  "packages/stdnum-darwin-arm64/package.json",
  "packages/stdnum-darwin-x64/package.json",
  "packages/stdnum-linux-arm64-gnu/package.json",
  "packages/stdnum-linux-x64-gnu/package.json",
  "packages/stdnum-win32-x64-msvc/package.json",
]);

export const RUNTIME_CARGO_MANIFESTS = new Set([
  "Cargo.lock",
  "Cargo.toml",
  "crates/stdnum-core/Cargo.toml",
  "crates/stdnum-napi/Cargo.toml",
  "crates/stdnum-py/Cargo.toml",
  "crates/stdnum-wasm/Cargo.toml",
]);

const RUNTIME_CHANGELOGS = new Set(
  [...RUNTIME_MANIFESTS].map((manifest) =>
    manifest.replace(/package\.json$/, "CHANGELOG.md"),
  ),
);

export const GENERATED_VERSION_METADATA = new Set([
  ...RUNTIME_MANIFESTS,
  ...RUNTIME_CARGO_MANIFESTS,
  ...RUNTIME_CHANGELOGS,
  "CHANGELOG.md",
  "VERSION",
  "bun.lock",
]);

export const generatedVersionMetadataOnly = (
  changedFiles: string[],
): boolean =>
  changedFiles.every(
    (file) =>
      GENERATED_VERSION_METADATA.has(file) ||
      CHANGESET_RE.test(file),
  );

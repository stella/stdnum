# @stll/stdnum

## 2.3.2

### Patch Changes

- [#183](https://github.com/stella/stdnum/pull/183) [`0c1bb1e`](https://github.com/stella/stdnum/commit/0c1bb1e8692b10756c2100f62c2ab3f6d1bcde06) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Publish refreshed package builds after updating dependencies and Rust quality tooling.

- [#190](https://github.com/stella/stdnum/pull/190) [`a5a5cd8`](https://github.com/stella/stdnum/commit/a5a5cd82c5ed24222801028ce5d3a2260775b994) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Resolve the host platform's native binding through literal `require` specifiers in `index.cjs`, so bundlers (Bun `--compile`, esbuild) embed the addon as a sidecar instead of failing on first use inside a bundle.

## 2.3.1

### Patch Changes

- [#176](https://github.com/stella/stdnum/pull/176) [`5059ce8`](https://github.com/stella/stdnum/commit/5059ce8be84753b9d017902f71cdc49be8c83eb9) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Expose allocation-free Czech bank-code membership checks from the Rust core.

## 2.3.0

### Minor Changes

- [#174](https://github.com/stella/stdnum/pull/174) [`72c4772`](https://github.com/stella/stdnum/commit/72c4772160b37841d78589ffea95267a2632197d) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Add explicit, idempotent browser initialization without top-level await, plus a typed error for validator calls made before initialization.

## 2.2.1

### Patch Changes

- [#171](https://github.com/stella/stdnum/pull/171) [`c9a13a3`](https://github.com/stella/stdnum/commit/c9a13a35c07a01ef10d651e72bc850769a1c281c) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Make synchronous validator subpath imports browser-safe by selecting the WebAssembly runtime through conditional package imports.

## 2.2.0

### Minor Changes

- [#170](https://github.com/stella/stdnum/pull/170) [`76a6f1d`](https://github.com/stella/stdnum/commit/76a6f1d5ab05e0307ef9888c62e3912f8ce3d390) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Add Czech national bank account validation as `cz.bankaccount`.

### Patch Changes

- [#168](https://github.com/stella/stdnum/pull/168) [`676724f`](https://github.com/stella/stdnum/commit/676724f9481d64b5a942188ea00e8187a2cf4ede) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Say which package is missing when the native binding cannot load. The platform
  binaries are optional dependencies, so an installer that declines them leaves
  the package importable and dead, throwing only on first use. The previous error
  listed every supported target, including the one it was running on, which reads
  as a portability problem rather than a missing install.

## 2.1.6

### Patch Changes

- [#166](https://github.com/stella/stdnum/pull/166) [`85a5db6`](https://github.com/stella/stdnum/commit/85a5db644ad333ccb5dc41fa56dd5fdce380746c) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Correct BBAN shape validation for Hungary, Jordan, Nicaragua, and Poland.

## 2.1.5

### Patch Changes

- [#165](https://github.com/stella/stdnum/pull/165) [`39a3512`](https://github.com/stella/stdnum/commit/39a35121366b40f5bfbf3397f89ed999c21627d4) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Expose allocation-free canonical predicates for selected module-owned validators.

- [#162](https://github.com/stella/stdnum/pull/162) [`62ed270`](https://github.com/stella/stdnum/commit/62ed270832fbf5ba591687de21b75584a30807aa) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Reject IBAN-like values whose country code is not assigned by the IBAN registry.

## 2.1.4

## 2.1.3

### Patch Changes

- [#154](https://github.com/stella/stdnum/pull/154) [`1fdfb35`](https://github.com/stella/stdnum/commit/1fdfb358be319f8fa40e4d298c8088719a7cb1f9) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Use a browser-safe clock directly in the Rust core when validating date-sensitive identifiers in WebAssembly.

## 2.1.2

### Patch Changes

- [#140](https://github.com/stella/stdnum/pull/140) [`2e966c1`](https://github.com/stella/stdnum/commit/2e966c1f2c627179b3d49f49e04e8a87e1f6f3cb) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Replace the TypeScript runtime with a full Rust validator core, thin Node.js, WASM, and Python bindings, generated drop-in TypeScript entrypoints, and platform packages.

- [#144](https://github.com/stella/stdnum/pull/144) [`37908f5`](https://github.com/stella/stdnum/commit/37908f5bc59078e2993f049e961da45336caf727) Thanks [@jan-kubica](https://github.com/jan-kubica)! - Add zero-allocation canonical validation paths, per-oracle performance gates, and batched Node.js and Python validation.

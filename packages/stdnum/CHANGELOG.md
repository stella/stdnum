# @stll/stdnum

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

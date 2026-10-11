# Fuzzing the stdnum core

Coverage-guided fuzz targets for the boundary-sensitive part of
`stella-stdnum-core`: the public `validate_id` entry point. Every jurisdiction
validator takes untrusted strings and does offset / codepoint math, so a
regression there is exactly the class of bug that examples miss (see the
`compact_se_personnummer` codepoint-boundary panic caught by
`tests/robustness.rs`).

This crate is its **own workspace** (empty `[workspace]` in `Cargo.toml`) so it
stays out of the main `--workspace` build and the strict release lints, and so
its target dependencies never touch the default build.

## Requirements

- The repository Rust 1.99.0 toolchain.
- `cargo-fuzz`: `cargo install cargo-fuzz --version 0.13.2 --locked`

## Targets

| Target        | Entry point   | Invariant defended                                                                                        |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `validate_id` | `validate_id` | Any (validator id, value) returns a bool, never panics / indexes OOB / slices a codepoint, for any UTF-8. |

## Running

From this directory, run coverage-guided fuzzing on the pinned stable toolchain
with sanitizers disabled:

```sh
cargo fuzz run validate_id --sanitizer none -- -max_total_time=30

# Longer campaign:
cargo fuzz run validate_id --sanitizer none -- -max_total_time=600
```

Stable code-generation options retain coverage instrumentation. CI smoke-runs
the target with `--sanitizer none` and a bounded run count.

List targets with `cargo fuzz list`. Crashes land in
`artifacts/validate_id/`; reproduce with:

```sh
cargo fuzz run validate_id --sanitizer none artifacts/validate_id/<crash-file>
```

Discovered corpus lives in `corpus/validate_id/`. Both directories are
git-ignored; commit a minimized reproducer as a regression case in
`crates/stdnum-core/tests/robustness.rs` instead of the raw corpus.

## Adding a target

1. Add `fuzz_targets/<name>.rs` with a `fuzz_target!` closure over `&[u8]`.
2. Register a `[[bin]]` entry in `Cargo.toml`.
3. Assert an invariant (round-trip, idempotence, bounds), not just "does not
   panic" — libFuzzer already catches panics for free, so an extra `assert!`
   is where the real coverage comes from.

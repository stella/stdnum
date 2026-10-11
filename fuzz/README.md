# Fuzzing the stdnum core

Fuzz target code for the boundary-sensitive part of
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

## Targets

| Target        | Entry point   | Invariant defended                                                                                        |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `validate_id` | `validate_id` | Any (validator id, value) returns a bool, never panics / indexes OOB / slices a codepoint, for any UTF-8. |

## Running

Compile and smoke-run the target on the pinned stable toolchain:

```sh
cargo check --manifest-path fuzz/Cargo.toml --bins
cargo run --manifest-path fuzz/Cargo.toml --locked --bin validate_id -- -runs=1000 -seed=20261011 -max_len=768
```

The smoke run exercises invariants without sanitizer or coverage
instrumentation. Generated robustness tests in
`crates/stdnum-core/tests/robustness.rs` provide deterministic regression
coverage. Coverage-guided cargo-fuzz execution requires compiler features
unavailable on stable Rust.

## Adding a target

1. Add `fuzz_targets/<name>.rs` with a `fuzz_target!` closure over `&[u8]`.
2. Register a `[[bin]]` entry in `Cargo.toml`.
3. Assert an invariant (round-trip, idempotence, bounds), not just "does not
   panic" — libFuzzer already catches panics for free, so an extra `assert!`
   is where the real coverage comes from.

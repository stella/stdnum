# Fuzzing the stdnum core

Coverage-guided fuzz targets for the boundary-sensitive part of
`stella-stdnum-core`: the public `validate_id` entry point. Every jurisdiction
validator takes untrusted strings and does offset / codepoint math, so a
regression there is exactly the class of bug that examples miss (see the
`compact_se_personnummer` codepoint-boundary panic caught by
`tests/robustness.rs`).

This crate is its **own workspace** (empty `[workspace]` in `Cargo.toml`) so it
stays out of the main `--workspace` build and the strict release lints, and so
its nightly-only sanitizer dependencies never touch the default build.

## Requirements

- A nightly toolchain: `nightly` (or a pinned `nightly-*`).
- `cargo-fuzz`: `cargo install cargo-fuzz --locked`

## Targets

| Target        | Entry point   | Invariant defended                                                                                        |
| ------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `validate_id` | `validate_id` | Any (validator id, value) returns a bool, never panics / indexes OOB / slices a codepoint, for any UTF-8. |

## Running

```sh
# From this directory. Short local smoke run:
cargo +nightly fuzz run validate_id -- -max_total_time=30

# Longer campaign:
cargo +nightly fuzz run validate_id -- -max_total_time=600
```

List targets with `cargo +nightly fuzz list`.

Crashes land in `fuzz/artifacts/<target>/`; reproduce with
`cargo +nightly fuzz run <target> fuzz/artifacts/<target>/<crash-file>`.
Discovered corpus lives in `fuzz/corpus/<target>/`. Both directories are
git-ignored (see `.gitignore`); commit a minimized reproducer as a regression
case in `crates/stdnum-core/tests/robustness.rs` instead of the raw corpus.

## Adding a target

1. Add `fuzz_targets/<name>.rs` with a `fuzz_target!` closure over `&[u8]`.
2. Register a `[[bin]]` entry in `Cargo.toml`.
3. Assert an invariant (round-trip, idempotence, bounds), not just "does not
   panic" — libFuzzer already catches panics for free, so an extra `assert!`
   is where the real coverage comes from.

#![no_main]

//! Boundary safety for the public validation entry point.
//!
//! `validate_id` takes untrusted strings and does slicing, indexing, and
//! integer arithmetic across every jurisdiction validator. Contract: for any
//! validator id and any input it returns a bool and never panics, never indexes
//! out of bounds, and never breaks a UTF-8 codepoint boundary. libFuzzer
//! catches panics for free; this drives both the id dispatch and the value
//! path so adversarial multi-byte and boundary-adjacent input is stressed.
//!
//! The property counterpart lives in `tests/robustness.rs`; a minimized crash
//! from here should be pinned there as a regression case.

use libfuzzer_sys::fuzz_target;
use stella_stdnum_core::{supported_validator_ids, validate_id};

fuzz_target!(|data: &[u8]| {
  let Ok(text) = core::str::from_utf8(data) else {
    return;
  };
  // First line steers the validator id, the remainder is the value, so the
  // fuzzer can explore both independently.
  let (id, value) = text.split_once('\n').unwrap_or((text, text));
  let _ = validate_id(id, value, None);
  // Also run the raw bytes against every known id to exercise each validator's
  // own slicing/arithmetic on the same adversarial input.
  for known in supported_validator_ids() {
    let _ = validate_id(known, text, None);
  }
});

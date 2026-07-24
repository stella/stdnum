//! Snapshot of the validator registry surface.
//!
//! The set of supported validator ids is a public contract shared with the
//! `NAPI` and `PyO3` bindings and the TypeScript oracle. A snapshot makes any
//! addition, removal, or rename a reviewable diff rather than a silent change.

use stella_stdnum_core::supported_validator_ids;

#[test]
fn supported_validator_ids_snapshot() {
  let mut ids: Vec<&str> = supported_validator_ids().to_vec();
  ids.sort_unstable();
  insta::assert_debug_snapshot!("supported_validator_ids", ids);
}

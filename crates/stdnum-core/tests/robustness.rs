//! Robustness properties for the public validation entry points.
//!
//! The validators take adversarial, untrusted strings and do a lot of slicing,
//! indexing, and integer arithmetic. Examples cannot cover that input space, so
//! these property tests assert the one invariant that must hold for every
//! input: validation returns a bool and never panics (no out-of-bounds slice,
//! no arithmetic overflow under the CI profile's overflow-checks, no codepoint
//! boundary break).

use proptest::prelude::*;
use stella_stdnum_core::{
  supported_validator_ids, validate_id, validate_named_id, validators,
};

proptest! {
  // Arbitrary UTF-8 against every known validator id.
  #[test]
  fn validate_named_id_never_panics(value in ".*") {
    for id in supported_validator_ids() {
      let _ = validate_named_id(id, &value);
    }
  }

  // The digits-only / crypto-candidate input hint exercises a different code
  // path (pre-normalization) that also does boundary math.
  #[test]
  fn validate_id_with_input_hint_never_panics(
    value in ".*",
    input in proptest::option::of(".*"),
  ) {
    for id in supported_validator_ids() {
      let _ = validate_id(id, &value, input.as_deref());
    }
  }

  // Unknown validator ids must be rejected, not panic, for any input.
  #[test]
  fn unknown_validator_is_rejected(id in "[a-z.]{0,12}", value in ".*") {
    if !supported_validator_ids().contains(&id.as_str()) {
      prop_assert!(!validate_named_id(&id, &value));
    }
  }

  // Every operation exposed by a full-surface validator remains total for
  // arbitrary UTF-8. Formatting invalid input is intentionally supported by
  // the TypeScript API, so it must be as robust as validation.
  #[test]
  fn full_surface_operations_never_panic(value in ".*") {
    for validator in validators() {
      let _ = validator.compact(&value);
      let _ = validator.format(&value);
      let _ = validator.validate(&value);
    }
  }
}

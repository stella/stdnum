//! German Tax ID.

pub use crate::validators::legacy_specs::de_idnr::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::de_idnr(value)
}

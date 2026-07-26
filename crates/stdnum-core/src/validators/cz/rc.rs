//! Czech Birth Number.

pub use crate::validators::legacy_specs::cz_rc::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::cz_rc(value)
}

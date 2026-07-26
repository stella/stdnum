//! German Tax Number.

pub use crate::validators::legacy_specs::de_stnr::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::de_stnr(value)
}

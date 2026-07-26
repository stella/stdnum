//! French VAT Number.

pub use crate::validators::legacy_specs::fr_tva::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::fr_tva(value)
}

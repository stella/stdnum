//! Belgian VAT Number.

pub use crate::validators::legacy_specs::be_vat::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::be_vat(value)
}

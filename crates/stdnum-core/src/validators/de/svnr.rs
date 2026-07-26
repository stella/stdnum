//! German Social Insurance Number.

pub use crate::validators::legacy_specs::de_svnr::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::de_svnr(value)
}

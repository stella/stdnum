//! Public facade for the sk.rc validator.

pub use crate::validators::additional_n_z::sk_rc::*;

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  crate::validators::canonical::cz_rc(value)
}

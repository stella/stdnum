//! Linker-friendly validator collections for constrained consumers.

use crate::ValidationResult;

type Validate = fn(&str) -> ValidationResult;

/// One validation-only entry in a [`ValidatorSet`].
#[derive(Clone, Copy)]
pub struct ValidatorEntry {
  id: &'static str,
  validate: Validate,
}

impl ValidatorEntry {
  #[must_use]
  pub const fn new(id: &'static str, validate: Validate) -> Self {
    Self { id, validate }
  }

  #[must_use]
  pub const fn id(self) -> &'static str {
    self.id
  }

  pub fn validate(self, value: &str) -> ValidationResult {
    (self.validate)(value)
  }
}

/// A static collection that only links the validation functions it references.
///
/// This is the preferred dispatch surface for binaries and WebAssembly modules
/// that need a known subset of the catalog. The global registry remains useful
/// for dynamic applications that need every validator and its full metadata.
#[derive(Clone, Copy)]
pub struct ValidatorSet {
  validators: &'static [ValidatorEntry],
}

impl ValidatorSet {
  #[must_use]
  pub const fn new(validators: &'static [ValidatorEntry]) -> Self {
    Self { validators }
  }

  #[must_use]
  pub const fn validators(self) -> &'static [ValidatorEntry] {
    self.validators
  }

  #[must_use]
  pub fn validator(self, id: &str) -> Option<ValidatorEntry> {
    self
      .validators
      .iter()
      .find(|validator| validator.id == id)
      .copied()
  }

  /// Validate with a selected validator, or return `None` for an unknown id.
  #[must_use]
  pub fn validate(self, id: &str, value: &str) -> Option<ValidationResult> {
    self
      .validator(id)
      .map(|validator| validator.validate(value))
  }

  /// Return `false` for both invalid values and ids outside this set.
  #[must_use]
  pub fn is_valid(self, id: &str, value: &str) -> bool {
    self
      .validator(id)
      .is_some_and(|validator| validator.validate(value).is_ok())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::validators::{at, global};

  static SELECTED: ValidatorSet = ValidatorSet::new(&[
    ValidatorEntry::new("iban", global::iban::validate),
    ValidatorEntry::new("at.businessid", at::businessid::validate),
  ]);

  #[test]
  fn dispatches_only_selected_validators() {
    assert!(SELECTED.is_valid("iban", "DE89370400440532013000"));
    assert!(SELECTED.is_valid("at.businessid", "122119m"));
    assert!(!SELECTED.is_valid("au.abn", "51824753556"));
    assert!(SELECTED.validate("au.abn", "51824753556").is_none());
  }
}

//! Linker-friendly validator collections for constrained consumers.

use crate::{ValidationResult, Validator};

type Validate = fn(&str) -> ValidationResult;

/// One validation-only entry in a [`ValidatorSet`].
#[derive(Clone, Copy)]
pub struct ValidatorEntry {
  id: &'static str,
  validate: Validate,
}

impl ValidatorEntry {
  /// Derive the canonical id and validation function from one module-owned
  /// validator. They cannot be paired independently.
  #[must_use]
  pub const fn from_validator(validator: &'static Validator) -> Self {
    Self {
      id: validator.id(),
      validate: validator.validation_function(),
    }
  }

  #[must_use]
  pub const fn id(self) -> &'static str {
    self.id
  }

  pub fn validate(self, value: &str) -> ValidationResult {
    (self.validate)(value)
  }
}

/// An invalid [`ValidatorSet`] definition.
#[derive(Clone, Copy, Debug, PartialEq, Eq, thiserror::Error)]
pub enum ValidatorSetError {
  /// The same canonical validator was selected more than once.
  #[error("duplicate validator id: {0}")]
  DuplicateId(&'static str),
}

const fn ids_equal(left: &str, right: &str) -> bool {
  let mut left = left.as_bytes();
  let mut right = right.as_bytes();

  loop {
    match (left, right) {
      ([], []) => return true,
      ([left_byte, left_tail @ ..], [right_byte, right_tail @ ..])
        if *left_byte == *right_byte =>
      {
        left = left_tail;
        right = right_tail;
      }
      _ => return false,
    }
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
  /// Create a set from canonical module-owned validators.
  ///
  /// # Errors
  ///
  /// Returns [`ValidatorSetError::DuplicateId`] when the same validator is
  /// selected more than once.
  pub const fn new(
    validators: &'static [ValidatorEntry],
  ) -> Result<Self, ValidatorSetError> {
    let mut remaining = validators;
    while let [validator, tail @ ..] = remaining {
      let mut candidates = tail;
      while let [candidate, candidate_tail @ ..] = candidates {
        if ids_equal(validator.id, candidate.id) {
          return Err(ValidatorSetError::DuplicateId(validator.id));
        }
        candidates = candidate_tail;
      }
      remaining = tail;
    }

    Ok(Self { validators })
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

  static SELECTED_ENTRIES: &[ValidatorEntry] = &[
    ValidatorEntry::from_validator(&global::iban::VALIDATOR),
    ValidatorEntry::from_validator(&at::businessid::VALIDATOR),
  ];
  static DUPLICATE_ENTRIES: &[ValidatorEntry] = &[
    ValidatorEntry::from_validator(&global::iban::VALIDATOR),
    ValidatorEntry::from_validator(&global::iban::VALIDATOR),
  ];

  #[test]
  fn dispatches_only_selected_validators() {
    let selected = ValidatorSet::new(SELECTED_ENTRIES);
    assert!(selected.is_ok());
    let Some(selected) = selected.ok() else {
      return;
    };

    assert!(selected.is_valid("iban", "DE89370400440532013000"));
    assert!(selected.is_valid("at.businessid", "122119m"));
    assert!(!selected.is_valid("au.abn", "51824753556"));
    assert!(selected.validate("au.abn", "51824753556").is_none());
  }

  #[test]
  fn derives_the_id_and_function_from_the_same_validator() {
    let entry = ValidatorEntry::from_validator(&at::businessid::VALIDATOR);

    assert_eq!(entry.id(), "at.businessid");
    assert!(entry.validate("122119m").is_ok());
  }

  #[test]
  fn rejects_duplicate_validator_ids() {
    assert!(matches!(
      ValidatorSet::new(DUPLICATE_ENTRIES),
      Err(ValidatorSetError::DuplicateId("iban")),
    ));
  }
}

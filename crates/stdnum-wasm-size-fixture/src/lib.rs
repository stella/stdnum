//! Representative linker-size fixture for a selected validator set.

use stella_stdnum_core::{ValidatorEntry, ValidatorSet, validators};
use wasm_bindgen::prelude::*;

const SELECTED_ENTRIES: [ValidatorEntry; 19] = [
  ValidatorEntry::from_validator(&validators::global::iban::VALIDATOR),
  ValidatorEntry::from_validator(&validators::at::businessid::VALIDATOR),
  ValidatorEntry::from_validator(&validators::at::tin::VALIDATOR),
  ValidatorEntry::from_validator(&validators::at::uid::VALIDATOR),
  ValidatorEntry::from_validator(&validators::at::vnr::VALIDATOR),
  ValidatorEntry::from_validator(&validators::ch::ssn::VALIDATOR),
  ValidatorEntry::from_validator(&validators::ch::uid::VALIDATOR),
  ValidatorEntry::from_validator(&validators::ch::vat::VALIDATOR),
  ValidatorEntry::from_validator(&validators::cz::dic::VALIDATOR),
  ValidatorEntry::from_validator(&validators::cz::ico::VALIDATOR),
  ValidatorEntry::from_validator(&validators::cz::rc::VALIDATOR),
  ValidatorEntry::from_validator(&validators::de::handelsreg::VALIDATOR),
  ValidatorEntry::from_validator(&validators::de::idnr::VALIDATOR),
  ValidatorEntry::from_validator(&validators::de::stnr::VALIDATOR),
  ValidatorEntry::from_validator(&validators::de::svnr::VALIDATOR),
  ValidatorEntry::from_validator(&validators::de::vat::VALIDATOR),
  ValidatorEntry::from_validator(&validators::sk::dic::VALIDATOR),
  ValidatorEntry::from_validator(&validators::sk::ico::VALIDATOR),
  ValidatorEntry::from_validator(&validators::sk::rc::VALIDATOR),
];

static SELECTED_VALIDATORS: Result<
  ValidatorSet,
  stella_stdnum_core::ValidatorSetError,
> = ValidatorSet::new(&SELECTED_ENTRIES);

#[wasm_bindgen(js_name = validateSelected)]
#[must_use]
pub fn validate_selected(id: &str, value: &str) -> bool {
  SELECTED_VALIDATORS
    .as_ref()
    .is_ok_and(|validators| validators.is_valid(id, value))
}

#[cfg(test)]
mod tests {
  use super::*;

  const EXPECTED_MANIFEST: &str = include_str!("../selected-validators.tsv");

  #[test]
  fn manifest_is_exact_and_every_validator_accepts_its_fixture() {
    assert!(SELECTED_VALIDATORS.is_ok());
    let Some(selected) = SELECTED_VALIDATORS.ok() else {
      return;
    };
    let fixtures = EXPECTED_MANIFEST
      .lines()
      .filter_map(|line| line.split_once('\t'))
      .collect::<Vec<_>>();

    assert_eq!(selected.validators().len(), 19);
    assert_eq!(fixtures.len(), 19);
    for (entry, &(expected_id, valid_value)) in
      selected.validators().iter().zip(&fixtures)
    {
      assert_eq!(entry.id(), expected_id);
      assert!(
        selected.is_valid(expected_id, valid_value),
        "{expected_id} rejected its manifest fixture",
      );
    }
  }
}

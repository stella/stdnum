//! Representative linker-size fixture for a selected validator set.

#[cfg(feature = "validator-set")]
use stella_stdnum_core::{ValidatorEntry, ValidatorSet, validators};
use wasm_bindgen::prelude::*;

#[cfg(feature = "validator-set")]
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

#[cfg(feature = "validator-set")]
static SELECTED_VALIDATORS: Result<
  ValidatorSet,
  stella_stdnum_core::ValidatorSetError,
> = ValidatorSet::new(&SELECTED_ENTRIES);

#[cfg(feature = "validator-set")]
#[wasm_bindgen(js_name = validateSelected)]
#[must_use]
pub fn validate_selected(id: &str, value: &str) -> bool {
  SELECTED_VALIDATORS
    .as_ref()
    .is_ok_and(|validators| validators.is_valid(id, value))
}

#[cfg(feature = "canonical-predicates")]
#[wasm_bindgen(js_name = validateCanonical)]
#[must_use]
pub fn validate_canonical(index: u32, value: &str) -> bool {
  use stella_stdnum_core::validators::{
    at, be, ch, cz, de, fr, global, pl, sk,
  };

  match index {
    0 => global::iban::is_valid_canonical(value),
    1 => at::businessid::is_valid_canonical(value),
    2 => at::tin::is_valid_canonical(value),
    3 => at::uid::is_valid_canonical(value),
    4 => at::vnr::is_valid_canonical(value),
    5 => be::vat::is_valid_canonical(value),
    6 => ch::ssn::is_valid_canonical(value),
    7 => cz::dic::is_valid_canonical(value),
    8 => cz::rc::is_valid_canonical(value),
    9 => de::handelsreg::is_valid_canonical(value),
    10 => de::idnr::is_valid_canonical(value),
    11 => de::stnr::is_valid_canonical(value),
    12 => de::svnr::is_valid_canonical(value),
    13 => de::vat::is_valid_canonical(value),
    14 => fr::tva::is_valid_canonical(value),
    15 => pl::nip::is_valid_canonical(value),
    16 => sk::dic::is_valid_canonical(value),
    17 => sk::rc::is_valid_canonical(value),
    _ => false,
  }
}

#[cfg(all(test, feature = "validator-set"))]
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

#[cfg(all(test, feature = "canonical-predicates"))]
mod canonical_tests {
  use super::validate_canonical;

  const FIXTURES: &[&str] = &[
    "DE89370400440532013000",
    "122119m",
    "591199013",
    "U13585627",
    "1237010180",
    "0776091951",
    "7561234567897",
    "25123891",
    "7103192745",
    "HRB 12345",
    "36574261809",
    "2181508150",
    "12010188M011",
    "136695976",
    "40303265045",
    "2234567895",
    "2021853504",
    "7103192745",
  ];

  #[test]
  fn every_canonical_predicate_is_linked_and_accepts_its_fixture() {
    for (index, value) in FIXTURES.iter().enumerate() {
      let Ok(index) = u32::try_from(index) else {
        return;
      };
      assert!(
        validate_canonical(index, value),
        "fixture {index} was rejected"
      );
    }
  }
}

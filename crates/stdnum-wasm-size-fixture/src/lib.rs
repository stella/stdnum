//! Representative linker-size fixture for a selected validator set.

use stella_stdnum_core::{ValidatorEntry, ValidatorSet, validators};
use wasm_bindgen::prelude::*;

static SELECTED_VALIDATORS: ValidatorSet = ValidatorSet::new(&[
  ValidatorEntry::new("iban", validators::global::iban::validate),
  ValidatorEntry::new("at.businessid", validators::at::businessid::validate),
  ValidatorEntry::new("at.tin", validators::at::tin::validate),
  ValidatorEntry::new("at.uid", validators::at::uid::validate),
  ValidatorEntry::new("at.vnr", validators::at::vnr::validate),
  ValidatorEntry::new("ch.ssn", validators::ch::ssn::validate),
  ValidatorEntry::new("ch.uid", validators::ch::uid::validate),
  ValidatorEntry::new("ch.vat", validators::ch::vat::validate),
  ValidatorEntry::new("cz.dic", validators::cz::dic::validate),
  ValidatorEntry::new("cz.ico", validators::cz::ico::validate),
  ValidatorEntry::new("cz.rc", validators::cz::rc::validate),
  ValidatorEntry::new("de.handelsreg", validators::de::handelsreg::validate),
  ValidatorEntry::new("de.idnr", validators::de::idnr::validate),
  ValidatorEntry::new("de.stnr", validators::de::stnr::validate),
  ValidatorEntry::new("de.svnr", validators::de::svnr::validate),
  ValidatorEntry::new("de.vat", validators::de::vat::validate),
  ValidatorEntry::new("sk.dic", validators::sk::dic::validate),
  ValidatorEntry::new("sk.ico", validators::sk::ico::validate),
  ValidatorEntry::new("sk.rc", validators::sk::rc::validate),
]);

#[wasm_bindgen(js_name = validateSelected)]
#[must_use]
pub fn validate_selected(id: &str, value: &str) -> bool {
  SELECTED_VALIDATORS.is_valid(id, value)
}

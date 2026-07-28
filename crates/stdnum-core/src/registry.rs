//! Thin registry for module-owned validator specifications.

use std::sync::OnceLock;

use crate::{types::Validator, validators as country_validators};

static PRIMARY_VALIDATORS: &[&Validator] = &[
  &country_validators::at::businessid::VALIDATOR,
  &country_validators::au::abn::VALIDATOR,
  &country_validators::br::cpf::VALIDATOR,
  &country_validators::cz::bankaccount::VALIDATOR,
  &country_validators::crypto::btcbase58::VALIDATOR,
  &country_validators::crypto::btcbech32::VALIDATOR,
  &country_validators::crypto::eth::VALIDATOR,
  &country_validators::crypto::wallet::VALIDATOR,
  &country_validators::es::dni::VALIDATOR,
  &country_validators::global::bic::VALIDATOR,
  &country_validators::global::creditcard::VALIDATOR,
  &country_validators::global::iban::VALIDATOR,
  &country_validators::global::isin::VALIDATOR,
  &country_validators::global::lei::VALIDATOR,
  &country_validators::global::luhn::VALIDATOR,
  &country_validators::us::ein::VALIDATOR,
];

/// Iterate validators that have completed the full-surface Rust migration.
#[must_use]
pub fn validators() -> &'static [&'static Validator] {
  static ALL: OnceLock<Vec<&'static Validator>> = OnceLock::new();
  ALL.get_or_init(|| {
    let mut validators = PRIMARY_VALIDATORS.to_vec();
    validators.extend_from_slice(country_validators::legacy_specs::VALIDATORS);
    validators
      .extend_from_slice(country_validators::additional_a_m::VALIDATORS);
    validators
      .extend_from_slice(country_validators::additional_n_z::VALIDATORS);
    validators.sort_unstable_by_key(|validator| validator.id());
    validators
  })
}

/// Find a full-surface validator by its stable catalog id.
#[must_use]
pub fn validator(id: &str) -> Option<&'static Validator> {
  validators()
    .binary_search_by(|candidate| candidate.id().cmp(id))
    .ok()
    .and_then(|index| validators().get(index).copied())
}

pub(crate) fn supported_validator_ids() -> &'static [&'static str] {
  static IDS: OnceLock<Vec<&'static str>> = OnceLock::new();
  IDS.get_or_init(|| {
    let mut ids = validators()
      .iter()
      .map(|item| item.id())
      .collect::<Vec<_>>();
    ids.sort_unstable();
    ids
  })
}

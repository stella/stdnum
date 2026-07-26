//! Swiss VAT Number.

use crate::{
  ValidationResult, Validator, compact_without,
  types::{CountryCode, EntityType, ValidatorScope, ValidatorSpec},
  validators::common::{
    generate_from_examples, invalid_checksum, invalid_format, is_digits,
  },
};

const EXAMPLES: &[&str] = &["CHE107787577IVA"];
const SUFFIXES: &[&str] = &["MWST", "TVA", "IVA", "TPV"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "ch.vat",
  name: "Swiss VAT Number",
  local_name: "Mehrwertsteuernummer",
  abbreviation: "MWST",
  aliases: &["MWST", "TVA", "IVA"],
  candidate_pattern: r"CHE-?\d{3}\.?\d{3}\.?\d{3}\s?(?:MWST|TVA|IVA)",
  scope: ValidatorScope::Country(CountryCode::Ch),
  entity_type: EntityType::Company,
  source_url: Some("https://www.estv.admin.ch/"),
  lengths: &[],
  examples: EXAMPLES,
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value.trim(), &[' ', '-', '.', '/', '(', ')']).to_uppercase()
}

#[must_use]
pub fn format(value: &str) -> String {
  let value = compact(value);
  let suffix = SUFFIXES
    .iter()
    .find(|suffix| value.ends_with(**suffix))
    .copied()
    .unwrap_or("");
  let digits = value
    .get(3..value.len().saturating_sub(suffix.len()))
    .unwrap_or("");
  format!(
    "CHE-{}.{}.{} {suffix}",
    digits.get(..3).unwrap_or(""),
    digits.get(3..6).unwrap_or(""),
    digits.get(6..).unwrap_or("")
  )
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  let Some(suffix) = SUFFIXES.iter().find(|suffix| value.ends_with(**suffix))
  else {
    return Err(invalid_format());
  };
  let uid = value
    .get(..value.len().saturating_sub(suffix.len()))
    .unwrap_or("");
  if !uid.starts_with("CHE")
    || uid.len() != 12
    || !uid.get(3..).is_some_and(is_digits)
  {
    return Err(invalid_format());
  }
  if crate::validators::ch::uid::validate(uid).is_err() {
    return Err(invalid_checksum());
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  generate_from_examples(EXAMPLES, compact, validate)
}

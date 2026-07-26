//! German Company Register Number.

use crate::{
  ValidationResult, Validator, compact_without,
  types::{CountryCode, EntityType, ValidatorScope, ValidatorSpec},
  validators::common::{
    generate_from_examples, invalid_component, invalid_format, is_digits,
  },
};

const EXAMPLES: &[&str] = &["HRB 12345"];
const KINDS: &[&str] = &["HRA", "HRB", "GNR", "PR", "VR"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "de.handelsreg",
  name: "German Company Register Number",
  local_name: "Handelsregisternummer",
  abbreviation: "HReg",
  aliases: &["Handelsregisternummer", "Handelsregister", "HRB", "HRA"],
  candidate_pattern: r"(?:HRA|HRB|GnR|PR|VR)\s*\d{1,7}",
  scope: ValidatorScope::Country(CountryCode::De),
  entity_type: EntityType::Company,
  source_url: Some(
    "https://de.wikipedia.org/wiki/Handelsregister_(Deutschland)",
  ),
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
  let compact = compact_without(value.trim(), &[' ', '-', '.']).to_uppercase();
  for kind in KINDS {
    if let Some(number) = compact.strip_prefix(kind)
      && (1..=7).contains(&number.len())
      && is_digits(number)
    {
      return format!("{kind} {number}");
    }
  }
  compact
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  let Some((kind, number)) = value.split_once(' ') else {
    return Err(invalid_format());
  };
  if !KINDS.contains(&kind) {
    return Err(invalid_component());
  }
  if number.is_empty() || number.len() > 7 || !is_digits(number) {
    return Err(invalid_format());
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  generate_from_examples(EXAMPLES, compact, validate)
}

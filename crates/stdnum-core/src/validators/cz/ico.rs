//! Czech Company ID.

use crate::{
  ValidationResult, Validator,
  types::{CountryCode, EntityType, ValidatorScope, ValidatorSpec},
  validators::common::{
    compact as compact_identifier, digit, generate_from_examples,
    invalid_checksum, require_digits, weighted_sum,
  },
};

const EXAMPLES: &[&str] = &["25123891", "27074358"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "cz.ico",
  name: "Czech Company ID",
  local_name: "Identifikační číslo osoby",
  abbreviation: "IČO",
  aliases: &["IČO", "IČ", "identifikační číslo"],
  candidate_pattern: r"\d{8}",
  scope: ValidatorScope::Country(CountryCode::Cz),
  entity_type: EntityType::Company,
  source_url: Some("https://www.czso.cz/"),
  lengths: &[8],
  examples: EXAMPLES,
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_identifier(value)
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  require_digits(&value, 8)?;
  let raw = (11_u32.saturating_sub(
    weighted_sum(value.get(..7).unwrap_or(""), &[8, 7, 6, 5, 4, 3, 2]) % 11,
  )) % 11;
  let check = if raw == 0 { 1 } else { raw % 10 };
  if check != digit(&value, 7) {
    return Err(invalid_checksum());
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  generate_from_examples(EXAMPLES, compact, validate)
}

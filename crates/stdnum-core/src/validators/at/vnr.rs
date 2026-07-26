//! Austrian Social Insurance Number.

use crate::{
  ValidationResult, Validator,
  types::{CountryCode, EntityType, ValidatorScope, ValidatorSpec},
  validators::common::{
    compact as compact_identifier, digit, generate_from_examples, groups,
    invalid_checksum, invalid_component, require_digits, weighted_sum,
  },
};

const EXAMPLES: &[&str] = &["1237010180"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "at.vnr",
  name: "Austrian Social Insurance Number",
  local_name: "Versicherungsnummer",
  abbreviation: "VNR",
  aliases: &[
    "VNR",
    "SVNR",
    "Versicherungsnummer",
    "Sozialversicherungsnummer",
  ],
  candidate_pattern: r"\d{4}\s?\d{6}",
  scope: ValidatorScope::Country(CountryCode::At),
  entity_type: EntityType::Person,
  source_url: Some("https://de.wikipedia.org/wiki/Sozialversicherungsnummer"),
  lengths: &[10],
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
  groups(&compact(value), &[(0, 4), (4, 10)], " ")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  require_digits(&value, 10)?;
  let day = value.get(4..6).and_then(|value| value.parse::<u32>().ok());
  if value.starts_with('0') || !day.is_some_and(|day| (1..=31).contains(&day)) {
    return Err(invalid_component());
  }
  let payload = format!(
    "{}{}",
    value.get(..3).unwrap_or(""),
    value.get(4..).unwrap_or("")
  );
  let check = weighted_sum(&payload, &[3, 7, 9, 5, 8, 4, 2, 1, 6]) % 11;
  if check == 10 || check != digit(&value, 3) {
    return Err(invalid_checksum());
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  generate_from_examples(EXAMPLES, compact, validate)
}

//! Swiss Social Security Number.

use crate::{
  ValidationResult, Validator,
  types::{CountryCode, EntityType, ValidatorScope, ValidatorSpec},
  validators::common::{
    compact as compact_identifier, digit, generate_from_examples, groups,
    invalid_checksum, invalid_component, require_digits,
  },
};

const EXAMPLES: &[&str] = &["7561234567897"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "ch.ssn",
  name: "Swiss Social Security Number",
  local_name: "AHV-Versichertennummer",
  abbreviation: "AHV",
  aliases: &["AHV-Nummer", "numéro AVS", "AVS", "AHV"],
  candidate_pattern: r"756\.?\d{4}\.?\d{4}\.?\d{2}",
  scope: ValidatorScope::Country(CountryCode::Ch),
  entity_type: EntityType::Person,
  source_url: Some("https://www.bsv.admin.ch/"),
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
  compact_identifier(value)
}

#[must_use]
pub fn format(value: &str) -> String {
  groups(&compact(value), &[(0, 3), (3, 7), (7, 11), (11, 13)], ".")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  require_digits(&value, 13)?;
  if !value.starts_with("756") {
    return Err(invalid_component());
  }
  let sum = value.get(..12).unwrap_or("").bytes().enumerate().fold(
    0_u32,
    |sum, (index, byte)| {
      sum.saturating_add(
        u32::from(byte.saturating_sub(b'0'))
          .saturating_mul(if index % 2 == 0 { 1 } else { 3 }),
      )
    },
  );
  if (10_u32.saturating_sub(sum % 10)) % 10 != digit(&value, 12) {
    return Err(invalid_checksum());
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  generate_from_examples(EXAMPLES, compact, validate)
}

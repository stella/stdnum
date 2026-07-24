use crate::{
  compact_without, decimal_digits_strict, is_ascii_digits, luhn_checksum,
  random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "luhn",
  name: "Luhn",
  local_name: "Luhn",
  abbreviation: "Luhn",
  aliases: &["Luhn", "Luhn algorithm", "mod 10"],
  candidate_pattern: r"\d{2,}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: Some("https://en.wikipedia.org/wiki/Luhn_algorithm"),
  lengths: &[],
  examples: &["4111111111111111", "18"],
  compact,
  format,
  validate,
  generate: Some(generate_default),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ', '-', '.'])
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if value.is_empty() {
    return Err(ValidationError::InvalidLength("Value must not be empty"));
  }
  if !is_ascii_digits(&value) {
    return Err(ValidationError::InvalidFormat(
      "Value must contain only digits",
    ));
  }
  if luhn_checksum(&decimal_digits_strict(&value)) != 0 {
    return Err(ValidationError::InvalidChecksum(
      "Luhn check digit does not match",
    ));
  }
  Ok(value)
}

#[must_use]
pub fn generate(length: usize) -> String {
  let payload_length = length.saturating_sub(1);
  let payload = random_digits(payload_length);
  let mut partial = decimal_digits_strict(&payload);
  partial.push(0);
  let check = 10_u32
    .saturating_sub(luhn_checksum(&partial))
    .rem_euclid(10);
  format!("{payload}{check}")
}

fn generate_default() -> String {
  generate(16)
}

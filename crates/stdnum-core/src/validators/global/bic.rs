use crate::{
  compact_without, random_below,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

const ALPHANUMERIC: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const COUNTRIES: &[&str] = &["DE", "GB", "US", "FR", "CH", "NL", "AT"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "bic",
  name: "Business Identifier Code",
  local_name: "Business Identifier Code",
  abbreviation: "BIC",
  aliases: &["BIC", "SWIFT", "BIC/SWIFT"],
  candidate_pattern: r"[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Company,
  source_url: Some("https://www.swift.com/"),
  lengths: &[],
  examples: &["DEUTDEFF", "DEUTDEFF500"],
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ', '-']).to_uppercase()
}

#[must_use]
pub fn format(value: &str) -> String {
  let value = compact(value);
  let mut chars = value.chars();
  let bank = chars.by_ref().take(4).collect::<String>();
  let country = chars.by_ref().take(2).collect::<String>();
  let location = chars.by_ref().take(2).collect::<String>();
  let branch = chars.collect::<String>();
  if branch.is_empty() {
    return format!("{bank} {country} {location}");
  }
  format!("{bank} {country} {location} {branch}")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if !matches!(value.len(), 8 | 11) {
    return Err(ValidationError::InvalidLength(
      "BIC must be 8 or 11 characters",
    ));
  }
  let chars = value.chars().collect::<Vec<_>>();
  let institution_valid = chars
    .get(..4)
    .is_some_and(|part| part.iter().all(char::is_ascii_uppercase));
  let country_valid = chars
    .get(4..6)
    .is_some_and(|part| part.iter().all(char::is_ascii_uppercase));
  let rest_valid = chars
    .get(6..)
    .is_some_and(|part| part.iter().all(char::is_ascii_alphanumeric));
  if !institution_valid || !country_valid || !rest_valid {
    return Err(ValidationError::InvalidFormat(
      "BIC must be 8 or 11 alphanumeric characters",
    ));
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  let country = COUNTRIES
    .get(random_below(COUNTRIES.len()))
    .copied()
    .unwrap_or("DE");
  let mut value = String::with_capacity(8);
  for _ in 0..4 {
    let offset = u8::try_from(random_below(26)).unwrap_or(0);
    value.push(char::from(b'A'.saturating_add(offset)));
  }
  value.push_str(country);
  for _ in 0..2 {
    value.push(char::from(
      *ALPHANUMERIC
        .get(random_below(ALPHANUMERIC.len()))
        .unwrap_or(&b'0'),
    ));
  }
  value
}

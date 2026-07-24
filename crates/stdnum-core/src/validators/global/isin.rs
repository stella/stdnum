use crate::{
  compact_without, decimal_digits_strict, luhn_checksum, random_below,
  random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

const COUNTRIES: &[&str] = &["US", "GB", "DE", "FR", "JP"];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "isin",
  name: "International Securities Identification Number",
  local_name: "International Securities Identification Number",
  abbreviation: "ISIN",
  aliases: &["ISIN", "International Securities Identification Number"],
  candidate_pattern: r"[A-Z]{2}[A-Z0-9]{9}\d",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: Some("https://www.isin.org/"),
  lengths: &[],
  examples: &["US0378331005", "GB0002634946"],
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

fn expand(value: &str) -> String {
  let mut expanded = String::with_capacity(value.len().saturating_mul(2));
  for ch in value.chars() {
    if ch.is_ascii_digit() {
      expanded.push(ch);
    } else if ch.is_ascii_uppercase() {
      let numeric = u32::from(ch)
        .saturating_sub(u32::from('A'))
        .saturating_add(10);
      expanded.push_str(&numeric.to_string());
    }
  }
  expanded
}

#[must_use]
pub fn format(value: &str) -> String {
  let value = compact(value);
  format!(
    "{} {} {} {}",
    value.get(..2).unwrap_or(""),
    value.get(2..6).unwrap_or(""),
    value.get(6..10).unwrap_or(""),
    value.get(10..).unwrap_or("")
  )
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if value.len() != 12 {
    return Err(ValidationError::InvalidLength(
      "ISIN must be exactly 12 characters",
    ));
  }
  if !value.chars().all(|ch| ch.is_ascii_alphanumeric()) {
    return Err(ValidationError::InvalidFormat(
      "ISIN must contain only letters and digits",
    ));
  }
  let shape_valid = value
    .get(..2)
    .is_some_and(|part| part.chars().all(|ch| ch.is_ascii_uppercase()))
    && value
      .get(2..11)
      .is_some_and(|part| part.chars().all(|ch| ch.is_ascii_alphanumeric()))
    && value
      .get(11..)
      .is_some_and(|part| part.chars().all(|ch| ch.is_ascii_digit()));
  if !shape_valid {
    return Err(ValidationError::InvalidFormat(
      "ISIN must match [A-Z]{2}[0-9A-Z]{9}[0-9]",
    ));
  }
  if luhn_checksum(&decimal_digits_strict(&expand(&value))) != 0 {
    return Err(ValidationError::InvalidChecksum(
      "ISIN check digit is incorrect",
    ));
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  loop {
    let country = COUNTRIES
      .get(random_below(COUNTRIES.len()))
      .copied()
      .unwrap_or("US");
    let base = format!("{country}{}", random_digits(9));
    for check in 0..=9 {
      let candidate = format!("{base}{check}");
      if validate(&candidate).is_ok() {
        return candidate;
      }
    }
  }
}

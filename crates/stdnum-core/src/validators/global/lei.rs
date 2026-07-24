use crate::{
  compact_without, random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "lei",
  name: "Legal Entity Identifier",
  local_name: "Legal Entity Identifier",
  abbreviation: "LEI",
  aliases: &["LEI", "Legal Entity Identifier"],
  candidate_pattern: r"[A-Z0-9]{18}\d{2}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Company,
  source_url: Some("https://www.gleif.org/"),
  lengths: &[],
  examples: &["5493006MHB84DD0ZWV18"],
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

fn mod97(value: &str) -> Option<u32> {
  let mut remainder = 0_u32;
  for ch in value.chars() {
    if ch.is_ascii_digit() {
      remainder = remainder
        .saturating_mul(10)
        .saturating_add(ch.to_digit(10)?)
        .rem_euclid(97);
    } else if ch.is_ascii_uppercase() {
      let numeric = u32::from(ch)
        .saturating_sub(u32::from('A'))
        .saturating_add(10);
      remainder = remainder
        .saturating_mul(100)
        .saturating_add(numeric)
        .rem_euclid(97);
    } else {
      return None;
    }
  }
  Some(remainder)
}

#[must_use]
pub fn format(value: &str) -> String {
  let value = compact(value);
  value
    .as_bytes()
    .chunks(4)
    .map(|chunk| std::str::from_utf8(chunk).unwrap_or(""))
    .collect::<Vec<_>>()
    .join(" ")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if value.len() != 20 {
    return Err(ValidationError::InvalidLength(
      "LEI must be exactly 20 characters",
    ));
  }
  if !value.chars().all(|ch| ch.is_ascii_alphanumeric()) {
    return Err(ValidationError::InvalidFormat(
      "LEI must contain only letters and digits",
    ));
  }
  if !value
    .get(18..)
    .is_some_and(|part| part.chars().all(|ch| ch.is_ascii_digit()))
  {
    return Err(ValidationError::InvalidFormat(
      "LEI check digits must be numeric",
    ));
  }
  if mod97(&value) != Some(1) {
    return Err(ValidationError::InvalidChecksum(
      "LEI check digits are incorrect",
    ));
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  loop {
    let base = random_digits(18);
    for check in 0..100 {
      let candidate = format!("{base}{check:02}");
      if validate(&candidate).is_ok() {
        return candidate;
      }
    }
  }
}

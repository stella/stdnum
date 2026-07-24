use crate::{
  char_at, compact_without, is_ascii_digits, random_digits,
  types::{
    CountryCode, EntityType, ValidationError, ValidationResult, Validator,
    ValidatorScope, ValidatorSpec,
  },
};

pub const CHECK_LETTERS: &str = "TRWAGMYFPDXBNJZSQVHLCKE";

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "es.dni",
  name: "Spanish National ID",
  local_name: "Documento Nacional de Identidad",
  abbreviation: "DNI",
  aliases: &["D.N.I.", "DNI", "documento nacional de identidad"],
  candidate_pattern: r"\d{1,2}\.?\d{3}\.?\d{3}-?[A-Z]",
  scope: ValidatorScope::Country(CountryCode::Es),
  entity_type: EntityType::Person,
  source_url: Some(
    "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/dni/",
  ),
  lengths: &[2, 3, 4, 5, 6, 7, 8, 9],
  examples: &["54362315K", "1234567L"],
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
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  let length = compact.chars().count();
  if !(2..=9).contains(&length) {
    return Err(ValidationError::InvalidLength(
      "DNI must be 1-8 digits and 1 letter",
    ));
  }
  let mut chars = compact.chars();
  let Some(letter) = chars.next_back() else {
    return Err(ValidationError::InvalidLength(
      "DNI must be 1-8 digits and 1 letter",
    ));
  };
  let digits = chars.as_str();
  if !is_ascii_digits(digits) {
    return Err(ValidationError::InvalidFormat(
      "DNI must start with 1-8 digits",
    ));
  }
  let number = digits.parse::<u32>().map_err(|_| {
    ValidationError::InvalidFormat("DNI must start with 1-8 digits")
  })?;
  if char_at(CHECK_LETTERS, number.rem_euclid(23)) != Some(letter) {
    return Err(ValidationError::InvalidChecksum(
      "DNI check letter does not match",
    ));
  }
  Ok(compact)
}

#[must_use]
pub fn generate() -> String {
  let number = random_digits(8);
  let parsed = number.parse::<u32>().unwrap_or(0);
  let letter = char_at(CHECK_LETTERS, parsed.rem_euclid(23)).unwrap_or('T');
  format!("{number}{letter}")
}

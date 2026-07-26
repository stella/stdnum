use crate::{
  compact_without, random_below, random_digits, starts_with_ignore_ascii_case,
  types::{
    CountryCode, EntityType, ValidationError, ValidationResult, Validator,
    ValidatorScope, ValidatorSpec,
  },
};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "at.businessid",
  name: "Austrian Company Register Number",
  local_name: "Firmenbuchnummer",
  abbreviation: "FN",
  aliases: &["Firmenbuchnummer", "FN", "FBN"],
  candidate_pattern: r"FN\s?\d{5,6}[a-z]?",
  scope: ValidatorScope::Country(CountryCode::At),
  entity_type: EntityType::Company,
  source_url: Some("https://www.justiz.gv.at/"),
  lengths: &[],
  examples: &["122119m"],
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  let compact = compact_without(value, &[' ', '-', '/', '.']);
  if starts_with_ignore_ascii_case(&compact, "FN") {
    return compact.chars().skip(2).collect::<String>().to_lowercase();
  }
  compact.to_lowercase()
}

#[must_use]
pub fn format(value: &str) -> String {
  format!("FN {}", compact(value))
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  if compact.chars().count() < 2 {
    return Err(ValidationError::InvalidLength(
      "Austrian Firmenbuchnummer is too short",
    ));
  }
  let mut chars = compact.chars();
  let Some(last) = chars.next_back() else {
    return Err(ValidationError::InvalidFormat(
      "Austrian Firmenbuchnummer must be digits followed by a letter",
    ));
  };
  if !last.is_ascii_alphabetic() || !chars.all(|ch| ch.is_ascii_digit()) {
    return Err(ValidationError::InvalidFormat(
      "Austrian Firmenbuchnummer must be digits followed by a letter",
    ));
  }
  Ok(compact)
}

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  let Some((last, digits)) = value.as_bytes().split_last() else {
    return false;
  };
  !digits.is_empty()
    && digits.iter().all(u8::is_ascii_digit)
    && last.is_ascii_lowercase()
}

#[must_use]
pub fn generate() -> String {
  let digit_count = 5_usize.saturating_add(random_below(2));
  let letter_offset = u8::try_from(random_below(26)).unwrap_or(0);
  format!(
    "{}{}",
    random_digits(digit_count),
    char::from(b'a'.saturating_add(letter_offset))
  )
}

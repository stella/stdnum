use crate::{
  compact_without, decimal_digits_strict, is_ascii_digits, random_digits,
  types::{
    CountryCode, EntityType, ValidationError, ValidationResult, Validator,
    ValidatorScope, ValidatorSpec,
  },
};

const WEIGHTS: [i32; 11] = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "au.abn",
  name: "Australian Business Number",
  local_name: "Australian Business Number",
  abbreviation: "ABN",
  aliases: &["ABN", "Australian Business Number"],
  candidate_pattern: r"\d{2}\s?\d{3}\s?\d{3}\s?\d{3}",
  scope: ValidatorScope::Country(CountryCode::Au),
  entity_type: EntityType::Company,
  source_url: Some("https://abr.business.gov.au/"),
  lengths: &[],
  examples: &["83914571673", "51824753556"],
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ', '-'])
}

#[must_use]
pub fn format(value: &str) -> String {
  let compact = compact(value);
  if compact.len() != 11 {
    return compact;
  }
  format!(
    "{} {} {} {}",
    compact.get(..2).unwrap_or(""),
    compact.get(2..5).unwrap_or(""),
    compact.get(5..8).unwrap_or(""),
    compact.get(8..).unwrap_or("")
  )
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  if !is_ascii_digits(&compact) {
    return Err(ValidationError::InvalidFormat(
      "ABN must contain only digits",
    ));
  }
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return Err(ValidationError::InvalidLength("ABN must be 11 digits"));
  };
  let mut sum = 0_i32;
  for (index, (digit, weight)) in digits.iter().zip(WEIGHTS).enumerate() {
    let digit = i32::try_from(*digit).unwrap_or(i32::MAX);
    let adjusted = if index == 0 {
      digit.saturating_sub(1)
    } else {
      digit
    };
    sum = sum.saturating_add(adjusted.saturating_mul(weight));
  }
  if sum.rem_euclid(89) != 0 {
    return Err(ValidationError::InvalidChecksum("ABN checksum mismatch"));
  }
  Ok(compact)
}

#[must_use]
pub fn generate() -> String {
  loop {
    let candidate = random_digits(11);
    if validate(&candidate).is_ok() {
      return candidate;
    }
  }
}

use crate::{
  compact_without, decimal_digits_strict, is_ascii_digits, random_digits,
  types::{
    CountryCode, EntityType, ValidationError, ValidationResult, Validator,
    ValidatorScope, ValidatorSpec,
  },
};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "br.cpf",
  name: "Brazilian CPF",
  local_name: "Cadastro de Pessoas Físicas",
  abbreviation: "CPF",
  aliases: &["CPF", "Cadastro de Pessoas Físicas"],
  candidate_pattern: r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}",
  scope: ValidatorScope::Country(CountryCode::Br),
  entity_type: EntityType::Person,
  source_url: Some("https://www.gov.br/receitafederal/"),
  lengths: &[],
  examples: &["39053344705"],
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ', '-', '.'])
}

#[must_use]
pub fn format(value: &str) -> String {
  let compact = compact(value);
  let mut chars = compact.chars();
  let first = chars.by_ref().take(3).collect::<String>();
  let second = chars.by_ref().take(3).collect::<String>();
  let third = chars.by_ref().take(3).collect::<String>();
  let check = chars.collect::<String>();
  format!("{first}.{second}.{third}-{check}")
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  if compact.chars().count() != 11 {
    return Err(ValidationError::InvalidLength("CPF must be 11 digits"));
  }
  if !is_ascii_digits(&compact) {
    return Err(ValidationError::InvalidFormat(
      "CPF must contain only digits",
    ));
  }
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return Err(ValidationError::InvalidFormat(
      "CPF must contain only digits",
    ));
  };
  if digits.iter().all(|digit| *digit == digits[0]) {
    return Err(ValidationError::InvalidFormat(
      "CPF must not be a repeated digit sequence",
    ));
  }
  let first = check_digit(&digits[..9], 10);
  let second = check_digit(&digits[..10], 11);
  if digits[9] != first || digits[10] != second {
    return Err(ValidationError::InvalidChecksum("CPF check digit mismatch"));
  }
  Ok(compact)
}

fn check_digit(digits: &[u32], weight_start: u32) -> u32 {
  let sum = digits
    .iter()
    .enumerate()
    .map(|(index, digit)| {
      let index = u32::try_from(index).unwrap_or(u32::MAX);
      digit.saturating_mul(weight_start.saturating_sub(index))
    })
    .sum::<u32>();
  11_u32
    .saturating_sub(sum.rem_euclid(11))
    .rem_euclid(11)
    .rem_euclid(10)
}

#[must_use]
pub fn generate() -> String {
  loop {
    let base = random_digits(9);
    let raw = decimal_digits_strict(&base);
    if raw
      .first()
      .is_some_and(|first| raw.iter().all(|digit| digit == first))
    {
      continue;
    }
    let first = check_digit(&raw, 10);
    let mut with_first = raw;
    with_first.push(first);
    let second = check_digit(&with_first, 11);
    return format!("{base}{first}{second}");
  }
}

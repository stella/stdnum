use crate::{
  compact_without, decimal_digits_strict, random_digits,
  types::{
    CanonicalValidation, CountryCode, EntityType, ValidationError,
    ValidationResult, Validator, ValidatorScope, ValidatorSpec,
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
})
.with_canonical_validator(validate_canonical);

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
  match validate_canonical(value) {
    CanonicalValidation::Valid => return Ok(value.to_owned()),
    CanonicalValidation::Invalid(error) => return Err(error),
    CanonicalValidation::NotCanonical => {}
  }
  let compact = compact(value);
  validate_ascii(compact.as_bytes())?;
  Ok(compact)
}

fn validate_canonical(value: &str) -> CanonicalValidation {
  if !value.is_ascii()
    || value.trim() != value
    || value.bytes().any(|byte| matches!(byte, b' ' | b'-' | b'.'))
  {
    return CanonicalValidation::NotCanonical;
  }
  match validate_ascii(value.as_bytes()) {
    Ok(()) => CanonicalValidation::Valid,
    Err(error) => CanonicalValidation::Invalid(error),
  }
}

fn validate_ascii(bytes: &[u8]) -> Result<(), ValidationError> {
  let Ok(bytes) = <&[u8; 11]>::try_from(bytes) else {
    return Err(ValidationError::InvalidLength("CPF must be 11 digits"));
  };
  if !bytes.iter().all(u8::is_ascii_digit) {
    return Err(ValidationError::InvalidFormat(
      "CPF must contain only digits",
    ));
  }
  if bytes
    .first()
    .is_some_and(|first| bytes.iter().all(|byte| byte == first))
  {
    return Err(ValidationError::InvalidFormat(
      "CPF must not be a repeated digit sequence",
    ));
  }
  let mut first_sum = 0_u32;
  let mut second_sum = 0_u32;
  let weights = [
    (10_u32, 11_u32),
    (9, 10),
    (8, 9),
    (7, 8),
    (6, 7),
    (5, 6),
    (4, 5),
    (3, 4),
    (2, 3),
  ];
  for (byte, (first_weight, second_weight)) in bytes.iter().take(9).zip(weights)
  {
    let digit = u32::from(byte.saturating_sub(b'0'));
    first_sum = first_sum.saturating_add(digit.saturating_mul(first_weight));
    second_sum = second_sum.saturating_add(digit.saturating_mul(second_weight));
  }
  let first = check_digit_from_sum(first_sum);
  second_sum = second_sum.saturating_add(first.saturating_mul(2));
  let second = check_digit_from_sum(second_sum);
  if bytes
    .get(9)
    .is_none_or(|byte| u32::from(byte.saturating_sub(b'0')) != first)
    || bytes
      .get(10)
      .is_none_or(|byte| u32::from(byte.saturating_sub(b'0')) != second)
  {
    return Err(ValidationError::InvalidChecksum("CPF check digit mismatch"));
  }
  Ok(())
}

const fn check_digit_from_sum(sum: u32) -> u32 {
  11_u32
    .saturating_sub(sum.rem_euclid(11))
    .rem_euclid(11)
    .rem_euclid(10)
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
  check_digit_from_sum(sum)
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

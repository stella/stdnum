use crate::{
  compact_without, decimal_digits_strict, is_ascii_digits, luhn_checksum,
  random_below, random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

const PREFIXES: &[(&str, usize)] = &[
  ("4", 16),
  ("51", 16),
  ("52", 16),
  ("53", 16),
  ("54", 16),
  ("55", 16),
];
const MAESTRO_PREFIXES: &[u32] =
  &[5018, 5020, 5038, 5893, 6304, 6759, 6761, 6762, 6763];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CardNetwork {
  Visa,
  Mastercard,
  Amex,
  Discover,
  Diners,
  Jcb,
  Unionpay,
  Maestro,
}

impl CardNetwork {
  #[must_use]
  pub const fn as_str(self) -> &'static str {
    match self {
      Self::Visa => "visa",
      Self::Mastercard => "mastercard",
      Self::Amex => "amex",
      Self::Discover => "discover",
      Self::Diners => "diners",
      Self::Jcb => "jcb",
      Self::Unionpay => "unionpay",
      Self::Maestro => "maestro",
    }
  }
}

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "creditcard",
  name: "Credit Card Number",
  local_name: "Credit Card Number",
  abbreviation: "CC",
  aliases: &[
    "credit card",
    "card number",
    "kreditní karta",
    "Kreditkarte",
  ],
  candidate_pattern: r"(?:\d[\s-]?){13,19}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: Some("https://www.iso.org/standard/70484.html"),
  lengths: &[],
  examples: &["4111111111111111", "5500000000000004"],
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
  let value = compact(value);
  if value.len() == 15 && value.starts_with('3') {
    return format!(
      "{} {} {}",
      value.get(..4).unwrap_or(""),
      value.get(4..10).unwrap_or(""),
      value.get(10..).unwrap_or("")
    );
  }
  value
    .as_bytes()
    .chunks(4)
    .map(|chunk| std::str::from_utf8(chunk).unwrap_or(""))
    .collect::<Vec<_>>()
    .join(" ")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if !(13..=19).contains(&value.len()) {
    return Err(ValidationError::InvalidLength(
      "Credit card number must be 13-19 digits",
    ));
  }
  if !is_ascii_digits(&value) {
    return Err(ValidationError::InvalidFormat(
      "Credit card number must contain only digits",
    ));
  }
  if luhn_checksum(&decimal_digits_strict(&value)) != 0 {
    return Err(ValidationError::InvalidChecksum(
      "Credit card number fails Luhn check",
    ));
  }
  Ok(value)
}

fn prefix_number(value: &str, length: usize) -> u32 {
  value
    .get(..length.min(value.len()))
    .and_then(|part| part.parse().ok())
    .unwrap_or(0)
}

#[must_use]
pub fn detect_network(value: &str) -> Option<CardNetwork> {
  let value = compact(value);
  if !is_ascii_digits(&value) {
    return None;
  }
  let d2 = prefix_number(&value, 2);
  let d3 = prefix_number(&value, 3);
  let d4 = prefix_number(&value, 4);
  let d6 = prefix_number(&value, 6);
  if matches!(d2, 34 | 37) {
    return Some(CardNetwork::Amex);
  }
  if matches!(d2, 36 | 38) || (300..=305).contains(&d3) {
    return Some(CardNetwork::Diners);
  }
  if (3528..=3589).contains(&d4) {
    return Some(CardNetwork::Jcb);
  }
  if value.starts_with('4') {
    return Some(CardNetwork::Visa);
  }
  if MAESTRO_PREFIXES.contains(&d4) {
    return Some(CardNetwork::Maestro);
  }
  if (51..=55).contains(&d2) || (2221..=2720).contains(&d4) {
    return Some(CardNetwork::Mastercard);
  }
  if d4 == 6011
    || (622_126..=622_925).contains(&d6)
    || (644..=649).contains(&d3)
    || d2 == 65
  {
    return Some(CardNetwork::Discover);
  }
  if d2 == 62 {
    return Some(CardNetwork::Unionpay);
  }
  None
}

#[must_use]
pub fn generate() -> String {
  let (prefix, length) = PREFIXES
    .get(random_below(PREFIXES.len()))
    .copied()
    .unwrap_or(("4", 16));
  let remaining = length.saturating_sub(prefix.len()).saturating_sub(1);
  let payload = format!("{prefix}{}", random_digits(remaining));
  let mut partial = decimal_digits_strict(&payload);
  partial.push(0);
  let check = 10_u32
    .saturating_sub(luhn_checksum(&partial))
    .rem_euclid(10);
  format!("{payload}{check}")
}

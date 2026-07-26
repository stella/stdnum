use crate::{
  compact_without, random_below, random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

#[derive(Clone, Copy)]
enum BbanCharacterClass {
  Digit,
  UppercaseLetter,
  UppercaseAlphanumeric,
}

type BbanPart = (usize, BbanCharacterClass);

const fn digits(length: usize) -> BbanPart {
  (length, BbanCharacterClass::Digit)
}

const fn uppercase(length: usize) -> BbanPart {
  (length, BbanCharacterClass::UppercaseLetter)
}

const fn alphanumeric(length: usize) -> BbanPart {
  (length, BbanCharacterClass::UppercaseAlphanumeric)
}

fn matches_bban_shape(value: &str, shape: &[BbanPart]) -> bool {
  let mut bytes = value.bytes();
  for (length, class) in shape {
    for _ in 0..*length {
      let Some(byte) = bytes.next() else {
        return false;
      };
      let matches = match class {
        BbanCharacterClass::Digit => byte.is_ascii_digit(),
        BbanCharacterClass::UppercaseLetter => byte.is_ascii_uppercase(),
        BbanCharacterClass::UppercaseAlphanumeric => {
          byte.is_ascii_digit() || byte.is_ascii_uppercase()
        }
      };
      if !matches {
        return false;
      }
    }
  }
  bytes.next().is_none()
}

#[allow(clippy::match_same_arms)]
fn has_valid_bban(country: &str, bban: &str) -> bool {
  let shape: &[BbanPart] = match country {
    "AD" => &[digits(8), alphanumeric(12)],
    "AE" => &[digits(19)],
    "AL" => &[digits(8), alphanumeric(16)],
    "AT" | "BA" | "EE" | "KZ" | "LT" | "LU" | "XK" => &[digits(16)],
    "AZ" => &[uppercase(4), alphanumeric(20)],
    "BE" => &[digits(12)],
    "BG" => &[uppercase(4), digits(6), alphanumeric(8)],
    "BH" => &[uppercase(4), alphanumeric(14)],
    "BR" => &[digits(23), uppercase(1), alphanumeric(1)],
    "BY" | "DO" => &[alphanumeric(4), digits(20)],
    "CH" | "HR" | "LI" => &[digits(17)],
    "CR" => {
      return bban.len() == 18
        && bban.starts_with('0')
        && bban.bytes().all(|byte| byte.is_ascii_digit());
    }
    "CY" => &[digits(8), alphanumeric(16)],
    "CZ" | "ES" | "HU" | "PL" | "SE" | "SK" | "TN" => &[digits(20)],
    "DE" | "ME" | "RS" | "VA" => &[digits(18)],
    "DK" | "FI" | "FO" | "GL" | "SD" => &[digits(14)],
    "EG" => &[digits(25)],
    "FR" | "MC" => &[digits(10), alphanumeric(11), digits(2)],
    "GB" | "IE" => &[uppercase(4), digits(14)],
    "GE" => &[uppercase(2), digits(16)],
    "GI" => &[uppercase(4), alphanumeric(15)],
    "GR" => &[digits(7), alphanumeric(16)],
    "GT" => &[alphanumeric(24)],
    "IL" | "TL" => &[digits(19)],
    "IQ" => &[uppercase(4), digits(15)],
    "IS" => &[digits(22)],
    "IT" | "SM" => &[uppercase(1), digits(10), alphanumeric(12)],
    "JO" | "SV" => &[uppercase(4), digits(20)],
    "KW" => &[uppercase(4), alphanumeric(22)],
    "LB" => &[digits(4), alphanumeric(20)],
    "LC" => &[uppercase(4), alphanumeric(24)],
    "LV" => &[uppercase(4), alphanumeric(13)],
    "MD" => &[alphanumeric(20)],
    "MK" => &[digits(3), alphanumeric(10), digits(2)],
    "MR" => &[digits(23)],
    "MT" => &[uppercase(4), digits(5), alphanumeric(18)],
    "MU" => &[uppercase(4), digits(19), uppercase(3)],
    "NI" => &[uppercase(4), digits(24)],
    "NL" => &[uppercase(4), digits(10)],
    "NO" => &[digits(11)],
    "PK" | "RO" => &[uppercase(4), alphanumeric(16)],
    "PS" | "QA" => &[uppercase(4), alphanumeric(21)],
    "PT" | "ST" => &[digits(21)],
    "SA" => &[digits(20)],
    "SC" => &[uppercase(4), digits(20), uppercase(3)],
    "SI" => &[digits(15)],
    "TR" => &[digits(6), alphanumeric(16)],
    "UA" => &[digits(6), alphanumeric(19)],
    "VG" => &[uppercase(4), digits(16)],
    _ => return true,
  };
  matches_bban_shape(bban, shape)
}

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "iban",
  name: "IBAN",
  local_name: "IBAN",
  abbreviation: "IBAN",
  aliases: &["IBAN"],
  candidate_pattern: r"[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?(?:[A-Z0-9]{4}[\s]?){2,7}[A-Z0-9]{1,4}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: Some(
    "https://www.swift.com/standards/data-standards/iban-international-bank-account-number",
  ),
  lengths: &[],
  examples: &["GB29NWBK60161331926819", "DE89370400440532013000"],
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

// Grouping these by country keeps the ISO table auditable against its source.
#[allow(clippy::match_same_arms)]
fn expected_length(country: &str) -> Option<usize> {
  Some(match country {
    "AD" => 24,
    "AE" => 23,
    "AL" => 28,
    "AT" => 20,
    "AZ" => 28,
    "BA" => 20,
    "BE" => 16,
    "BG" | "BH" => 22,
    "BI" => 27,
    "BR" => 29,
    "BY" => 28,
    "CH" => 21,
    "CR" => 22,
    "CY" => 28,
    "CZ" => 24,
    "DE" => 22,
    "DJ" => 27,
    "DK" => 18,
    "DO" => 28,
    "EE" => 20,
    "EG" => 29,
    "ES" => 24,
    "FI" | "FO" => 18,
    "FR" => 27,
    "GB" | "GE" => 22,
    "GI" => 23,
    "GL" => 18,
    "GR" => 27,
    "GT" => 28,
    "HR" => 21,
    "HU" => 28,
    "IE" => 22,
    "IL" | "IQ" => 23,
    "IS" => 26,
    "IT" => 27,
    "JO" | "KW" => 30,
    "KZ" => 20,
    "LB" => 28,
    "LC" => 32,
    "LI" => 21,
    "LT" | "LU" => 20,
    "LV" => 21,
    "LY" => 25,
    "MC" => 27,
    "MD" => 24,
    "ME" => 22,
    "MK" => 19,
    "MN" => 20,
    "MR" => 27,
    "MT" => 31,
    "MU" => 30,
    "NI" => 28,
    "NL" => 18,
    "NO" => 15,
    "PK" => 24,
    "PL" => 28,
    "PS" | "QA" => 29,
    "PT" => 25,
    "RO" => 24,
    "RS" => 22,
    "RU" => 33,
    "SA" => 24,
    "SC" => 31,
    "SD" => 18,
    "SE" | "SK" => 24,
    "SI" => 19,
    "SM" => 27,
    "SN" => 28,
    "SO" | "TL" => 23,
    "ST" => 25,
    "SV" => 28,
    "TN" => 24,
    "TR" => 26,
    "UA" => 29,
    "VA" => 22,
    "VG" => 24,
    "XK" => 20,
    _ => return None,
  })
}

fn mod97(value: &str) -> Option<u32> {
  let mut remainder = 0_u32;
  for ch in value.chars() {
    if ch.is_ascii_digit() {
      remainder = (remainder
        .saturating_mul(10)
        .saturating_add(ch.to_digit(10)?))
        % 97;
    } else if ch.is_ascii_uppercase() {
      let number = u32::from(ch)
        .saturating_sub(u32::from('A'))
        .saturating_add(10);
      remainder = (remainder.saturating_mul(100).saturating_add(number)) % 97;
    } else {
      return None;
    }
  }
  Some(remainder)
}

#[must_use]
pub fn format(value: &str) -> String {
  let value = compact(value);
  let mut groups = Vec::new();
  let mut chars = value.chars();
  loop {
    let group = chars.by_ref().take(4).collect::<String>();
    if group.is_empty() {
      break;
    }
    groups.push(group);
  }
  groups.join(" ")
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if value.len() < 5 {
    return Err(ValidationError::InvalidLength("IBAN is too short"));
  }
  if !value.chars().all(|ch| ch.is_ascii_alphanumeric()) {
    return Err(ValidationError::InvalidFormat(
      "IBAN must contain only letters and digits",
    ));
  }
  let Some(country) = value.get(..2) else {
    return Err(ValidationError::InvalidComponent(
      "IBAN must start with a 2-letter country code",
    ));
  };
  if !country.chars().all(|ch| ch.is_ascii_uppercase()) {
    return Err(ValidationError::InvalidComponent(
      "IBAN must start with a 2-letter country code",
    ));
  }
  if expected_length(country).is_some_and(|length| value.len() != length) {
    return Err(ValidationError::InvalidLength(
      "IBAN has an invalid country-specific length",
    ));
  }
  let bban = value.get(4..).unwrap_or("");
  if !has_valid_bban(country, bban) {
    return Err(ValidationError::InvalidFormat(
      "IBAN BBAN format is invalid for its country",
    ));
  }
  let rearranged =
    format!("{}{country}{}", bban, value.get(2..4).unwrap_or(""));
  if mod97(&rearranged) != Some(1) {
    return Err(ValidationError::InvalidChecksum(
      "IBAN check digits are incorrect",
    ));
  }
  Ok(value)
}

#[must_use]
pub fn generate() -> String {
  let countries = [("CZ", 20_usize), ("DE", 18), ("SK", 20)];
  let (country, length) = countries
    .get(random_below(countries.len()))
    .copied()
    .unwrap_or(("DE", 18));
  let bban = random_digits(length);
  let placeholder = format!("{bban}{country}00");
  let check = 98_u32.saturating_sub(mod97(&placeholder).unwrap_or(0));
  format!("{country}{check:02}{bban}")
}

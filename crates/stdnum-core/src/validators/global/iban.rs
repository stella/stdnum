use std::{collections::HashMap, sync::LazyLock};

use regex::Regex;

use crate::{
  compact_without, random_below, random_digits,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

static BBAN_FORMATS: LazyLock<HashMap<&'static str, Regex>> =
  LazyLock::new(|| {
    let formats = [
      ("AD", r"^\d{8}[A-Z0-9]{12}$"),
      ("AE", r"^\d{19}$"),
      ("AL", r"^\d{8}[A-Z0-9]{16}$"),
      ("AT", r"^\d{16}$"),
      ("AZ", r"^[A-Z]{4}[A-Z0-9]{20}$"),
      ("BA", r"^\d{16}$"),
      ("BE", r"^\d{12}$"),
      ("BG", r"^[A-Z]{4}\d{6}[A-Z0-9]{8}$"),
      ("BH", r"^[A-Z]{4}[A-Z0-9]{14}$"),
      ("BR", r"^\d{23}[A-Z][A-Z0-9]$"),
      ("BY", r"^[A-Z0-9]{4}\d{20}$"),
      ("CH", r"^\d{17}$"),
      ("CR", r"^0\d{17}$"),
      ("CY", r"^\d{8}[A-Z0-9]{16}$"),
      ("CZ", r"^\d{20}$"),
      ("DE", r"^\d{18}$"),
      ("DK", r"^\d{14}$"),
      ("DO", r"^[A-Z0-9]{4}\d{20}$"),
      ("EE", r"^\d{16}$"),
      ("EG", r"^\d{25}$"),
      ("ES", r"^\d{20}$"),
      ("FI", r"^\d{14}$"),
      ("FO", r"^\d{14}$"),
      ("FR", r"^\d{10}[A-Z0-9]{11}\d{2}$"),
      ("GB", r"^[A-Z]{4}\d{14}$"),
      ("GE", r"^[A-Z]{2}\d{16}$"),
      ("GI", r"^[A-Z]{4}[A-Z0-9]{15}$"),
      ("GL", r"^\d{14}$"),
      ("GR", r"^\d{7}[A-Z0-9]{16}$"),
      ("GT", r"^[A-Z0-9]{24}$"),
      ("HR", r"^\d{17}$"),
      ("HU", r"^\d{24}$"),
      ("IE", r"^[A-Z]{4}\d{14}$"),
      ("IL", r"^\d{19}$"),
      ("IQ", r"^[A-Z]{4}\d{15}$"),
      ("IS", r"^\d{22}$"),
      ("IT", r"^[A-Z]\d{10}[A-Z0-9]{12}$"),
      ("JO", r"^[A-Z]{4}\d{22}$"),
      ("KW", r"^[A-Z]{4}[A-Z0-9]{22}$"),
      ("KZ", r"^\d{16}$"),
      ("LB", r"^\d{4}[A-Z0-9]{20}$"),
      ("LC", r"^[A-Z]{4}[A-Z0-9]{24}$"),
      ("LI", r"^\d{17}$"),
      ("LT", r"^\d{16}$"),
      ("LU", r"^\d{16}$"),
      ("LV", r"^[A-Z]{4}[A-Z0-9]{13}$"),
      ("MC", r"^\d{10}[A-Z0-9]{11}\d{2}$"),
      ("MD", r"^[A-Z0-9]{20}$"),
      ("ME", r"^\d{18}$"),
      ("MK", r"^\d{3}[A-Z0-9]{10}\d{2}$"),
      ("MR", r"^\d{23}$"),
      ("MT", r"^[A-Z]{4}\d{5}[A-Z0-9]{18}$"),
      ("MU", r"^[A-Z]{4}\d{19}[A-Z]{3}$"),
      ("NI", r"^[A-Z]{4}\d{24}$"),
      ("NL", r"^[A-Z]{4}\d{10}$"),
      ("NO", r"^\d{11}$"),
      ("PK", r"^[A-Z]{4}[A-Z0-9]{16}$"),
      ("PL", r"^\d{24}$"),
      ("PS", r"^[A-Z]{4}[A-Z0-9]{21}$"),
      ("PT", r"^\d{21}$"),
      ("QA", r"^[A-Z]{4}[A-Z0-9]{21}$"),
      ("RO", r"^[A-Z]{4}[A-Z0-9]{16}$"),
      ("RS", r"^\d{18}$"),
      ("SA", r"^\d{20}$"),
      ("SC", r"^[A-Z]{4}\d{20}[A-Z]{3}$"),
      ("SD", r"^\d{14}$"),
      ("SE", r"^\d{20}$"),
      ("SI", r"^\d{15}$"),
      ("SK", r"^\d{20}$"),
      ("SM", r"^[A-Z]\d{10}[A-Z0-9]{12}$"),
      ("ST", r"^\d{21}$"),
      ("SV", r"^[A-Z]{4}\d{20}$"),
      ("TL", r"^\d{19}$"),
      ("TN", r"^\d{20}$"),
      ("TR", r"^\d{6}[A-Z0-9]{16}$"),
      ("UA", r"^\d{6}[A-Z0-9]{19}$"),
      ("VA", r"^\d{18}$"),
      ("VG", r"^[A-Z]{4}\d{16}$"),
      ("XK", r"^\d{16}$"),
    ];
    formats
      .into_iter()
      .filter_map(|(country, pattern)| {
        Regex::new(pattern).ok().map(|regex| (country, regex))
      })
      .collect()
  });

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
  if BBAN_FORMATS
    .get(country)
    .is_some_and(|regex| !regex.is_match(bban))
  {
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

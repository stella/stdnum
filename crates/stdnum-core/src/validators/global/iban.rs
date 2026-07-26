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

#[derive(Clone, Copy)]
enum BbanShape {
  One([BbanPart; 1]),
  Two([BbanPart; 2]),
  Three([BbanPart; 3]),
}

impl BbanShape {
  const fn parts(&self) -> &[BbanPart] {
    match self {
      Self::One(parts) => parts,
      Self::Two(parts) => parts,
      Self::Three(parts) => parts,
    }
  }

  fn length(self) -> usize {
    self.parts().iter().map(|(length, _)| length).sum::<usize>()
  }
}

const fn shape(part: BbanPart) -> BbanShape {
  BbanShape::One([part])
}

const fn shape2(first: BbanPart, second: BbanPart) -> BbanShape {
  BbanShape::Two([first, second])
}

const fn shape3(
  first: BbanPart,
  second: BbanPart,
  third: BbanPart,
) -> BbanShape {
  BbanShape::Three([first, second, third])
}

const fn digits(length: usize) -> BbanPart {
  (length, BbanCharacterClass::Digit)
}

const fn uppercase(length: usize) -> BbanPart {
  (length, BbanCharacterClass::UppercaseLetter)
}

const fn alphanumeric(length: usize) -> BbanPart {
  (length, BbanCharacterClass::UppercaseAlphanumeric)
}

fn matches_bban_shape(value: &str, shape: BbanShape) -> bool {
  let mut bytes = value.bytes();
  for (length, class) in shape.parts() {
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
fn bban_shape(country: &str) -> Option<BbanShape> {
  let shape = match country {
    "AD" => shape2(digits(8), alphanumeric(12)),
    "AE" => shape(digits(19)),
    "AL" => shape2(digits(8), alphanumeric(16)),
    "AT" | "BA" | "EE" | "KZ" | "LT" | "LU" | "XK" => shape(digits(16)),
    "AZ" => shape2(uppercase(4), alphanumeric(20)),
    "BE" => shape(digits(12)),
    "BG" => shape3(uppercase(4), digits(6), alphanumeric(8)),
    "BH" => shape2(uppercase(4), alphanumeric(14)),
    "BR" => shape3(digits(23), uppercase(1), alphanumeric(1)),
    "BY" | "DO" => shape2(alphanumeric(4), digits(20)),
    "CH" | "HR" | "LI" => shape(digits(17)),
    "CR" => shape(digits(18)),
    "CY" => shape2(digits(8), alphanumeric(16)),
    "CZ" | "ES" | "SE" | "SK" | "TN" => shape(digits(20)),
    "HU" | "PL" => shape(digits(24)),
    "DE" | "ME" | "RS" | "VA" => shape(digits(18)),
    "DK" | "FI" | "FO" | "GL" | "SD" => shape(digits(14)),
    "EG" => shape(digits(25)),
    "FR" | "MC" => shape3(digits(10), alphanumeric(11), digits(2)),
    "GB" | "IE" => shape2(uppercase(4), digits(14)),
    "GE" => shape2(uppercase(2), digits(16)),
    "GI" => shape2(uppercase(4), alphanumeric(15)),
    "GR" => shape2(digits(7), alphanumeric(16)),
    "GT" => shape(alphanumeric(24)),
    "IL" | "TL" => shape(digits(19)),
    "IQ" => shape2(uppercase(4), digits(15)),
    "IS" => shape(digits(22)),
    "IT" | "SM" => shape3(uppercase(1), digits(10), alphanumeric(12)),
    "JO" => shape3(uppercase(4), digits(4), alphanumeric(18)),
    "SV" => shape2(uppercase(4), digits(20)),
    "KW" => shape2(uppercase(4), alphanumeric(22)),
    "LB" => shape2(digits(4), alphanumeric(20)),
    "LC" => shape2(uppercase(4), alphanumeric(24)),
    "LV" => shape2(uppercase(4), alphanumeric(13)),
    "MD" => shape(alphanumeric(20)),
    "MK" => shape3(digits(3), alphanumeric(10), digits(2)),
    "MR" => shape(digits(23)),
    "MT" => shape3(uppercase(4), digits(5), alphanumeric(18)),
    "MU" => shape3(uppercase(4), digits(19), uppercase(3)),
    "NI" => shape2(uppercase(4), digits(20)),
    "NL" => shape2(uppercase(4), digits(10)),
    "NO" => shape(digits(11)),
    "PK" | "RO" => shape2(uppercase(4), alphanumeric(16)),
    "PS" | "QA" => shape2(uppercase(4), alphanumeric(21)),
    "PT" | "ST" => shape(digits(21)),
    "SA" => shape(digits(20)),
    "SC" => shape3(uppercase(4), digits(20), uppercase(3)),
    "SI" => shape(digits(15)),
    "TR" => shape2(digits(6), alphanumeric(16)),
    "UA" => shape2(digits(6), alphanumeric(19)),
    "VG" => shape2(uppercase(4), digits(16)),
    _ => return None,
  };
  Some(shape)
}

fn has_valid_bban(country: &str, bban: &str) -> bool {
  if country == "CR" {
    return bban.len() == 18
      && bban.starts_with('0')
      && bban.bytes().all(|byte| byte.is_ascii_digit());
  }
  bban_shape(country).is_none_or(|shape| matches_bban_shape(bban, shape))
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

// Shaped countries derive their total length from the BBAN descriptor. Keep an
// explicit assigned length only when this validator does not encode the shape.
fn expected_length(country: &str) -> Option<usize> {
  if let Some(shape) = bban_shape(country) {
    return Some(4_usize.saturating_add(shape.length()));
  }
  Some(match country {
    "BI" | "DJ" => 27,
    "LY" => 25,
    "MN" => 20,
    "RU" => 33,
    "SN" => 28,
    "SO" => 23,
    _ => return None,
  })
}

fn mod97(value: &str) -> Option<u32> {
  mod97_segments(&[value])
}

fn mod97_segments(segments: &[&str]) -> Option<u32> {
  let mut remainder = 0_u32;
  for ch in segments.iter().flat_map(|segment| segment.chars()) {
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

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  let Some(country) = value.get(..2) else {
    return false;
  };
  let Some(check_digits) = value.get(2..4) else {
    return false;
  };
  let Some(bban) = value.get(4..) else {
    return false;
  };
  let Some(expected_length) = expected_length(country) else {
    return false;
  };
  value.len() == expected_length
    && country.bytes().all(|byte| byte.is_ascii_uppercase())
    && check_digits.bytes().all(|byte| byte.is_ascii_digit())
    && has_valid_bban(country, bban)
    && mod97_segments(&[bban, country, check_digits]) == Some(1)
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
  let Some(expected_length) = expected_length(country) else {
    return Err(ValidationError::InvalidComponent(
      "IBAN country code is not assigned",
    ));
  };
  if value.len() != expected_length {
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

#[cfg(test)]
mod tests {
  use super::{
    BbanCharacterClass, BbanShape, ValidationError, bban_shape,
    expected_length, is_valid_canonical, mod97, validate,
  };

  fn with_valid_check_digits(country: &str, bban: &str) -> String {
    let placeholder = format!("{bban}{country}00");
    let check = 98_u32.saturating_sub(mod97(&placeholder).unwrap_or(0));
    format!("{country}{check:02}{bban}")
  }

  fn valid_bban(shape: BbanShape) -> String {
    shape
      .parts()
      .iter()
      .flat_map(|(length, class)| {
        let character = match class {
          BbanCharacterClass::Digit => '0',
          BbanCharacterClass::UppercaseLetter
          | BbanCharacterClass::UppercaseAlphanumeric => 'A',
        };
        std::iter::repeat_n(character, *length)
      })
      .collect()
  }

  fn invalid_class_bban(shape: BbanShape) -> Option<String> {
    let mut offset = 0_usize;
    for (length, class) in shape.parts() {
      let replacement = match class {
        BbanCharacterClass::Digit => Some("A"),
        BbanCharacterClass::UppercaseLetter => Some("0"),
        BbanCharacterClass::UppercaseAlphanumeric => None,
      };
      if let Some(replacement) = replacement {
        let mut bban = valid_bban(shape);
        bban.replace_range(offset..offset.saturating_add(1), replacement);
        return Some(bban);
      }
      offset = offset.saturating_add(*length);
    }
    None
  }

  #[test]
  fn corrected_registry_shapes_accept_their_electronic_examples() {
    for candidate in [
      "HU42117730161111101800000000",
      "JO94CBJO0010000000000131000302",
      "NI45BAPR00000013000003558124",
      "PL61109010140000071219812874",
    ] {
      assert_eq!(validate(candidate).as_deref(), Ok(candidate));
      assert!(is_valid_canonical(candidate));
    }
  }

  #[test]
  fn every_explicit_shape_matches_its_length_and_both_validation_paths() {
    for first in b'A'..=b'Z' {
      for second in b'A'..=b'Z' {
        let country = format!("{}{}", char::from(first), char::from(second));
        let (Some(expected), Some(shape)) =
          (expected_length(&country), bban_shape(&country))
        else {
          continue;
        };
        assert_eq!(
          expected,
          4_usize.saturating_add(shape.length()),
          "{country} has inconsistent IBAN and BBAN lengths",
        );
        let candidate = with_valid_check_digits(&country, &valid_bban(shape));
        assert_eq!(
          validate(&candidate).as_deref(),
          Ok(candidate.as_str()),
          "full validator rejected valid-by-construction {country} IBAN",
        );
        assert!(
          is_valid_canonical(&candidate),
          "canonical validator rejected valid-by-construction {country} IBAN",
        );

        if let Some(invalid_bban) = invalid_class_bban(shape) {
          let invalid = with_valid_check_digits(&country, &invalid_bban);
          assert!(
            validate(&invalid).is_err(),
            "full validator accepted a class-invalid {country} BBAN",
          );
          assert!(
            !is_valid_canonical(&invalid),
            "canonical validator accepted a class-invalid {country} BBAN",
          );
        }
      }
    }
  }

  #[test]
  fn rejects_a_checksum_valid_polish_iban_with_a_non_numeric_bban() {
    let candidate = with_valid_check_digits("PL", "10901014A000071219812874");
    assert!(matches!(
      validate(&candidate),
      Err(ValidationError::InvalidFormat(
        "IBAN BBAN format is invalid for its country"
      ))
    ));
    assert!(!is_valid_canonical(&candidate));
  }

  #[test]
  fn rejects_every_unassigned_country_even_with_valid_check_digits() {
    const BBAN: &str = "01101050000010547023795";
    for first in b'A'..=b'Z' {
      for second in b'A'..=b'Z' {
        let country = format!("{}{}", char::from(first), char::from(second));
        if expected_length(&country).is_some() {
          continue;
        }
        let candidate = with_valid_check_digits(&country, BBAN);
        assert!(
          matches!(
            validate(&candidate),
            Err(ValidationError::InvalidComponent(
              "IBAN country code is not assigned"
            ))
          ),
          "unassigned country {country} was accepted",
        );
        assert!(
          !is_valid_canonical(&candidate),
          "canonical predicate accepted unassigned country {country}",
        );
      }
    }
  }
}

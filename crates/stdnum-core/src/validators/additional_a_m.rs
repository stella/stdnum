//! Full-surface validators added during the Rust source-of-truth migration.

#![allow(
  clippy::arithmetic_side_effects,
  clippy::as_conversions,
  clippy::cast_possible_truncation,
  clippy::indexing_slicing,
  clippy::integer_division,
  clippy::items_after_statements,
  clippy::many_single_char_names,
  clippy::match_same_arms,
  clippy::shadow_unrelated,
  clippy::string_slice,
  clippy::too_many_lines
)]

use crate::{
  compact_without, random_below,
  types::{
    CountryCode, EntityType, Gender, IsoDate, ParsedIdentifier,
    ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

macro_rules! validator {
  ($module:ident, $id:literal, $country:expr, $entity:expr, $name:literal, $local:literal, $abbreviation:literal, $pattern:literal, $source:literal, $lengths:expr, $examples:expr, $aliases:expr) => {
    pub mod $module {
      use super::*;

      pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
        id: $id,
        name: $name,
        local_name: $local,
        abbreviation: $abbreviation,
        aliases: $aliases,
        candidate_pattern: $pattern,
        scope: ValidatorScope::Country($country),
        entity_type: $entity,
        source_url: Some($source),
        lengths: $lengths,
        examples: $examples,
        compact,
        format,
        validate,
        generate: Some(generate),
        parse: parse_function($id),
      });

      #[must_use]
      pub fn compact(value: &str) -> String {
        compact_for($id, value)
      }

      #[must_use]
      pub fn format(value: &str) -> String {
        format_for($id, value)
      }

      pub fn validate(value: &str) -> ValidationResult {
        validate_for($id, value)
      }

      #[must_use]
      pub fn generate() -> String {
        generate_for($id, $examples)
      }

      #[must_use]
      pub fn parse(value: &str) -> Option<ParsedIdentifier> {
        parse_function($id).and_then(|parse| parse(value))
      }

      #[must_use]
      pub fn calc_check_digit(value: &str) -> Option<u32> {
        check_digit_for($id, value)
      }
    }
  };
}

macro_rules! global_validator {
  ($module:ident, $id:literal, $entity:expr, $name:literal, $local:literal, $abbreviation:literal, $pattern:literal, $source:literal, $lengths:expr, $examples:expr, $aliases:expr) => {
    pub mod $module {
      use super::*;

      pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
        id: $id,
        name: $name,
        local_name: $local,
        abbreviation: $abbreviation,
        aliases: $aliases,
        candidate_pattern: $pattern,
        scope: ValidatorScope::Global,
        entity_type: $entity,
        source_url: Some($source),
        lengths: $lengths,
        examples: $examples,
        compact,
        format,
        validate,
        generate: Some(generate),
        parse: None,
      });

      #[must_use]
      pub fn compact(value: &str) -> String {
        compact_for($id, value)
      }

      #[must_use]
      pub fn format(value: &str) -> String {
        format_for($id, value)
      }

      pub fn validate(value: &str) -> ValidationResult {
        validate_for($id, value)
      }

      #[must_use]
      pub fn generate() -> String {
        generate_for($id, $examples)
      }
    }
  };
}

const fn invalid_length() -> ValidationError {
  ValidationError::InvalidLength("identifier has an invalid length")
}

const fn invalid_format() -> ValidationError {
  ValidationError::InvalidFormat("identifier has an invalid format")
}

const fn invalid_component() -> ValidationError {
  ValidationError::InvalidComponent("identifier contains an invalid component")
}

const fn invalid_checksum() -> ValidationError {
  ValidationError::InvalidChecksum("identifier checksum mismatch")
}

fn is_digits(value: &str) -> bool {
  !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit())
}

fn is_upper(value: &str) -> bool {
  !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_uppercase())
}

fn digit(value: &str, index: usize) -> u32 {
  value
    .as_bytes()
    .get(index)
    .map_or(0, |byte| u32::from(byte.saturating_sub(b'0')))
}

fn parse_number(value: &str) -> u32 {
  value.bytes().fold(0_u32, |number, byte| {
    number
      .saturating_mul(10)
      .saturating_add(u32::from(byte.saturating_sub(b'0')))
  })
}

fn weighted_sum(value: &str, weights: &[u32]) -> u32 {
  value.bytes().zip(weights.iter().copied()).fold(
    0_u32,
    |sum, (byte, weight)| {
      sum.saturating_add(
        u32::from(byte.saturating_sub(b'0')).saturating_mul(weight),
      )
    },
  )
}

fn luhn_valid(value: &str) -> bool {
  if !is_digits(value) {
    return false;
  }
  value
    .bytes()
    .rev()
    .enumerate()
    .fold(0_u32, |sum, (index, byte)| {
      let mut number = u32::from(byte.saturating_sub(b'0'));
      if index % 2 == 1 {
        number = number.saturating_mul(2);
        if number > 9 {
          number = number.saturating_sub(9);
        }
      }
      sum.saturating_add(number)
    })
    .is_multiple_of(10)
}

fn mod97(value: &str) -> u32 {
  value.bytes().fold(0_u32, |remainder, byte| {
    remainder
      .saturating_mul(10)
      .saturating_add(u32::from(byte.saturating_sub(b'0')))
      .rem_euclid(97)
  })
}

const fn is_leap_year(year: i32) -> bool {
  (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

const fn valid_date(year: i32, month: u32, day: u32) -> bool {
  let days = match month {
    1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
    4 | 6 | 9 | 11 => 30,
    2 if is_leap_year(year) => 29,
    2 => 28,
    _ => return false,
  };
  day > 0 && day <= days
}

fn day_of_year_to_date(year: i32, ordinal: u32) -> Option<IsoDate> {
  let mut remaining = ordinal;
  for month in 1_u32..=12 {
    let days = match month {
      1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
      4 | 6 | 9 | 11 => 30,
      2 if is_leap_year(year) => 29,
      2 => 28,
      _ => 0,
    };
    if remaining <= days {
      return Some(IsoDate {
        year,
        month: u8::try_from(month).unwrap_or(0),
        day: u8::try_from(remaining).unwrap_or(0),
      });
    }
    remaining = remaining.saturating_sub(days);
  }
  None
}

fn current_year() -> i32 {
  i32::try_from(crate::current_year()).unwrap_or(1970)
}

fn compact_for(id: &str, value: &str) -> String {
  if matches!(id, "al.nipt" | "by.unp") {
    let upper = compact_without(value.trim(), &[' ']).to_uppercase();
    let stripped = if id == "al.nipt" {
      upper
        .strip_prefix("(AL)")
        .or_else(|| upper.strip_prefix("AL"))
    } else {
      upper
        .strip_prefix("УНП")
        .or_else(|| upper.strip_prefix("UNP"))
    };
    let stripped = stripped.unwrap_or(&upper);
    if id == "al.nipt" {
      return stripped.to_owned();
    }
    return stripped
      .chars()
      .map(|character| match character {
        'А' => 'A',
        'В' => 'B',
        'С' => 'C',
        'Е' => 'E',
        'Н' => 'H',
        'К' => 'K',
        'М' => 'M',
        'О' => 'O',
        'Р' => 'P',
        'Т' => 'T',
        other => other,
      })
      .collect();
  }
  if matches!(id, "az.voen" | "gb.nhs" | "ma.ice" | "md.idno") {
    let compact = compact_without(value.trim(), &[' ']);
    return if id == "az.voen" && compact.len() == 9 {
      format!("0{compact}")
    } else {
      compact
    };
  }
  if matches!(id, "gb.sedol" | "gh.tin" | "pt.cc") {
    return compact_without(value.trim(), &[' ']).to_uppercase();
  }
  if matches!(id, "cz.rc" | "sk.rc") {
    return compact_without(value.trim(), &[' ', '/']);
  }
  if id == "li.peid" {
    return compact_without(value.trim(), &[' ', '.'])
      .trim_start_matches('0')
      .to_owned();
  }
  if id == "mk.edb" {
    let compact = compact_without(value.trim(), &[' ', '-']);
    return compact
      .strip_prefix("MK")
      .or_else(|| compact.strip_prefix("МК"))
      .unwrap_or(&compact)
      .to_owned();
  }
  if id == "cr.cpf" {
    let mut compact = compact_without(value.trim(), &[' ']).to_uppercase();
    let parts = compact.split('-').collect::<Vec<_>>();
    if let [first, second, third] = parts.as_slice() {
      compact = format!("{first:0>2}{second:0>4}{third:0>4}");
    } else {
      compact = compact.replace('-', "");
    }
    if compact.len() == 9 {
      compact.insert(0, '0');
    }
    return compact;
  }
  let compact = compact_without(value.trim(), &[' ', '-', '.', '/', '(', ')']);
  let upper = compact.to_uppercase();
  match id {
    "de.handelsreg" => {
      let compact =
        compact_without(value.trim(), &[' ', '-', '.']).to_uppercase();
      for kind in ["HRA", "HRB", "GNR", "PR", "VR"] {
        if let Some(number) = compact.strip_prefix(kind)
          && (1..=7).contains(&number.len())
          && is_digits(number)
        {
          return format!("{kind} {number}");
        }
      }
      compact
    }
    "cl.rut" => upper.strip_prefix("CL").unwrap_or(&upper).to_owned(),
    "gt.nit" => upper.trim_start_matches('0').to_owned(),
    "il.idnr" => format!("{compact:0>9}"),
    "eg.tn" | "iq.nid" | "ir.nid" => compact
      .chars()
      .map(|character| match character {
        '٠' | '۰' => '0',
        '١' | '۱' => '1',
        '٢' | '۲' => '2',
        '٣' | '۳' => '3',
        '٤' | '۴' => '4',
        '٥' | '۵' => '5',
        '٦' | '۶' => '6',
        '٧' | '۷' => '7',
        '٨' | '۸' => '8',
        '٩' | '۹' => '9',
        other => other,
      })
      .collect(),
    "mc.tva" => {
      if upper.starts_with("FR") {
        upper
      } else {
        format!("FR{upper}")
      }
    }
    "is.vsk" => compact
      .strip_prefix("IS")
      .or_else(|| compact.strip_prefix("is"))
      .unwrap_or(&compact)
      .to_owned(),
    "ad.nrt" | "ch.vat" | "cn.uscc" | "eu.vat" | "hk.hkid" | "in.gstin"
    | "in.pan" | "lk.nic" | "mu.brn" | "mx.curp" | "mx.rfc" => upper,
    _ => compact,
  }
}

fn groups(value: &str, spans: &[(usize, usize)], separator: &str) -> String {
  spans
    .iter()
    .map(|(start, end)| value.get(*start..*end).unwrap_or(""))
    .collect::<Vec<_>>()
    .join(separator)
}

fn format_for(id: &str, value: &str) -> String {
  let value = compact_for(id, value);
  match id {
    "ad.nrt" => groups(&value, &[(0, 1), (1, 7), (7, 8)], "-"),
    "ae.eid" => groups(&value, &[(0, 3), (3, 7), (7, 14), (14, 15)], "-"),
    "ai.tin" => groups(&value, &[(0, 5), (5, 10)], "-"),
    "ar.cbu" => groups(&value, &[(0, 8), (8, 22)], " "),
    "ar.cuit" => groups(&value, &[(0, 2), (2, 10), (10, 11)], "-"),
    "ar.dni" if value.len() == 7 => {
      groups(&value, &[(0, 1), (1, 4), (4, 7)], ".")
    }
    "ar.dni" => groups(&value, &[(0, 2), (2, 5), (5, 8)], "."),
    "at.vnr" => groups(&value, &[(0, 4), (4, 10)], " "),
    "au.tfn" if value.len() == 8 => {
      groups(&value, &[(0, 3), (3, 6), (6, 8)], " ")
    }
    "au.tfn" => groups(&value, &[(0, 3), (3, 6), (6, 9)], " "),
    "ba.jmbg" | "gr.amka" => value,
    "be.bis" => format!(
      "{}.{}.{}-{}.{}",
      value.get(0..2).unwrap_or(""),
      value.get(2..4).unwrap_or(""),
      value.get(4..6).unwrap_or(""),
      value.get(6..9).unwrap_or(""),
      value.get(9..11).unwrap_or("")
    ),
    "az.voen" => groups(&value, &[(0, 3), (3, 6), (6, 10)], " "),
    "bz.tin" if value.len() == 8 => groups(&value, &[(0, 6), (6, 8)], "-"),
    "ca.bn" if value.len() == 15 => format!(
      "{} {} {} {} {}",
      value.get(..3).unwrap_or(""),
      value.get(3..6).unwrap_or(""),
      value.get(6..9).unwrap_or(""),
      value.get(9..11).unwrap_or(""),
      value.get(11..).unwrap_or("")
    ),
    "ca.bn" if value.len() == 9 => {
      groups(&value, &[(0, 3), (3, 6), (6, 9)], " ")
    }
    "ca.sin" => groups(&value, &[(0, 3), (3, 6), (6, 9)], "-"),
    "ch.ssn" => groups(&value, &[(0, 3), (3, 7), (7, 11), (11, 13)], "."),
    "ch.vat" => {
      let suffix = ["MWST", "TVA", "IVA", "TPV"]
        .iter()
        .find(|suffix| value.ends_with(**suffix))
        .copied()
        .unwrap_or("");
      let digits = value
        .get(3..value.len().saturating_sub(suffix.len()))
        .unwrap_or("");
      format!(
        "CHE-{}.{}.{} {suffix}",
        digits.get(..3).unwrap_or(""),
        digits.get(3..6).unwrap_or(""),
        digits.get(6..).unwrap_or("")
      )
    }
    "cl.rut" => {
      let split = value.len().saturating_sub(7);
      format!(
        "{}.{}.{}-{}",
        value.get(..split).unwrap_or(""),
        value.get(split..split + 3).unwrap_or(""),
        value.get(split + 3..split + 6).unwrap_or(""),
        value.get(split + 6..).unwrap_or("")
      )
    }
    "co.nit" => {
      let split = value.len().saturating_sub(1);
      let body = value.get(..split).unwrap_or("");
      let mut chunks = body
        .as_bytes()
        .rchunks(3)
        .map(|chunk| std::str::from_utf8(chunk).unwrap_or(""))
        .collect::<Vec<_>>();
      chunks.reverse();
      format!("{}-{}", chunks.join("."), value.get(split..).unwrap_or(""))
    }
    "de.handelsreg" => value,
    "bh.cpr" => groups(&value, &[(0, 2), (2, 4), (4, 9)], "-"),
    "cr.cpf" => groups(&value, &[(0, 2), (2, 6), (6, 10)], "-"),
    "do.rnc" if value.len() == 9 => {
      groups(&value, &[(0, 1), (1, 3), (3, 8), (8, 9)], "-")
    }
    "do.rnc" => groups(&value, &[(0, 3), (3, 10), (10, 11)], "-"),
    "gb.utr" => groups(&value, &[(0, 5), (5, 10)], " "),
    "fr.nif" => {
      groups(&value, &[(0, 2), (2, 4), (4, 7), (7, 10), (10, 13)], " ")
    }
    "eg.tn" => groups(&value, &[(0, 3), (3, 6), (6, 9)], "-"),
    "gt.nit" => format!(
      "{}-{}",
      value.get(..value.len().saturating_sub(1)).unwrap_or(""),
      value.get(value.len().saturating_sub(1)..).unwrap_or("")
    ),
    "hk.hkid" => format!(
      "{}({})",
      value.get(..value.len().saturating_sub(1)).unwrap_or(""),
      value.get(value.len().saturating_sub(1)..).unwrap_or("")
    ),
    "id.npwp" if value.len() == 15 => format!(
      "{}.{}.{}.{}-{}.{}",
      value.get(0..2).unwrap_or(""),
      value.get(2..5).unwrap_or(""),
      value.get(5..8).unwrap_or(""),
      value.get(8..9).unwrap_or(""),
      value.get(9..12).unwrap_or(""),
      value.get(12..).unwrap_or("")
    ),
    "in.aadhaar" => groups(&value, &[(0, 4), (4, 8), (8, 12)], " "),
    "is.kennitala" => groups(&value, &[(0, 6), (6, 10)], "-"),
    "il.idnr" => format!(
      "{}-{}",
      value.get(..8).unwrap_or(""),
      value.get(8..).unwrap_or("")
    ),
    "jp.mynumber" => groups(&value, &[(0, 4), (4, 8), (8, 12)], " "),
    "kr.brn" => groups(&value, &[(0, 3), (3, 5), (5, 10)], "-"),
    "kr.rrn" => groups(&value, &[(0, 6), (6, 13)], "-"),
    "kw.civil" => groups(&value, &[(0, 1), (1, 7), (7, 11), (11, 12)], " "),
    "kz.iin" => groups(&value, &[(0, 6), (6, 12)], " "),
    "mx.clabe" => groups(&value, &[(0, 3), (3, 6), (6, 17), (17, 18)], " "),
    "my.nric" => groups(&value, &[(0, 6), (6, 8), (8, 12)], "-"),
    _ => value,
  }
}

fn check_structure(
  value: &str,
  lengths: &[usize],
) -> Result<(), ValidationError> {
  if !lengths.contains(&value.len()) {
    return Err(invalid_length());
  }
  if !is_digits(value) {
    return Err(invalid_format());
  }
  Ok(())
}

fn rut_check(body: &str) -> char {
  let weights = [2_u32, 3, 4, 5, 6, 7];
  let sum = body
    .bytes()
    .rev()
    .enumerate()
    .fold(0_u32, |sum, (index, byte)| {
      sum.saturating_add(
        u32::from(byte.saturating_sub(b'0'))
          .saturating_mul(weights.get(index % 6).copied().unwrap_or(0)),
      )
    });
  match 11_u32.saturating_sub(sum.rem_euclid(11)) {
    11 => '0',
    10 => 'K',
    number => char::from_digit(number, 10).unwrap_or('0'),
  }
}

fn validate_for(id: &str, input: &str) -> ValidationResult {
  let value = compact_for(id, input);
  if id == "ca.sin" && !is_digits(&value) {
    return Err(invalid_format());
  }
  match id {
    "ad.nrt" => {
      if value.len() != 8 {
        return Err(invalid_length());
      }
      let prefix = value.as_bytes().first().copied().unwrap_or_default();
      let suffix = value.as_bytes().last().copied().unwrap_or_default();
      let middle = value.get(1..7).unwrap_or("");
      if !prefix.is_ascii_uppercase()
        || !suffix.is_ascii_uppercase()
        || !is_digits(middle)
      {
        return Err(invalid_format());
      }
      if !b"ACDEFGLOPU".contains(&prefix) {
        return Err(invalid_component());
      }
      if prefix == b'F' && middle > "699999" {
        return Err(invalid_component());
      }
      if matches!(prefix, b'A' | b'L')
        && !("699999" < middle && middle < "800000")
      {
        return Err(invalid_component());
      }
    }
    "ae.eid" => {
      check_structure(&value, &[15])?;
      if !value.starts_with("784") {
        return Err(invalid_component());
      }
      if !luhn_valid(&value) {
        return Err(invalid_checksum());
      }
    }
    "ai.tin" => {
      check_structure(&value, &[10])?;
      if !matches!(value.as_bytes().first(), Some(b'1' | b'2')) {
        return Err(invalid_component());
      }
    }
    "al.nipt" => {
      if value.len() != 10 {
        return Err(invalid_length());
      }
      let bytes = value.as_bytes();
      if !matches!(bytes.first(), Some(b'A'..=b'M'))
        || !bytes
          .get(1..9)
          .is_some_and(|middle| middle.iter().all(u8::is_ascii_digit))
        || !bytes.last().is_some_and(u8::is_ascii_uppercase)
      {
        return Err(invalid_format());
      }
    }
    "am.tin" => check_structure(&value, &[8])?,
    "ar.cbu" => {
      check_structure(&value, &[22])?;
      let first =
        weighted_sum(value.get(..7).unwrap_or(""), &[7, 1, 3, 9, 7, 1, 3]);
      let second = weighted_sum(
        value.get(8..21).unwrap_or(""),
        &[3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3],
      );
      if (10 - first % 10) % 10 != digit(&value, 7)
        || (10 - second % 10) % 10 != digit(&value, 21)
      {
        return Err(invalid_checksum());
      }
    }
    "ar.cuit" => {
      check_structure(&value, &[11])?;
      if !["20", "23", "24", "27", "30", "33", "34", "50", "51", "55"]
        .contains(&value.get(..2).unwrap_or(""))
      {
        return Err(invalid_component());
      }
      let sum = weighted_sum(
        value.get(..10).unwrap_or(""),
        &[5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
      );
      let raw = 11 - sum % 11;
      let expected = match raw {
        11 => 0,
        10 => 9,
        other => other,
      };
      if digit(&value, 10) != expected {
        return Err(invalid_checksum());
      }
    }
    "ar.dni" => check_structure(&value, &[7, 8])?,
    "at.vnr" => {
      check_structure(&value, &[10])?;
      if value.starts_with('0')
        || !(1..=31).contains(&parse_number(value.get(4..6).unwrap_or("")))
      {
        return Err(invalid_component());
      }
      let payload = format!(
        "{}{}",
        value.get(..3).unwrap_or(""),
        value.get(4..).unwrap_or("")
      );
      let check = weighted_sum(&payload, &[3, 7, 9, 5, 8, 4, 2, 1, 6]) % 11;
      if check == 10 || check != digit(&value, 3) {
        return Err(invalid_checksum());
      }
    }
    "au.tfn" => {
      if !is_digits(&value) {
        return Err(invalid_format());
      }
      if ![8, 9].contains(&value.len()) {
        return Err(invalid_length());
      }
      if !weighted_sum(&value, &[1, 4, 3, 7, 5, 8, 6, 9, 10]).is_multiple_of(11)
      {
        return Err(invalid_checksum());
      }
    }
    "az.voen" => {
      check_structure(&value, &[10])?;
      if !matches!(value.as_bytes().last(), Some(b'1' | b'2')) {
        return Err(invalid_component());
      }
      let check =
        weighted_sum(value.get(..8).unwrap_or(""), &[4, 1, 8, 6, 2, 7, 5, 3])
          % 11;
      if check == 10 || check != digit(&value, 8) {
        return Err(invalid_checksum());
      }
    }
    "ba.jmbg" => {
      check_structure(&value, &[13])?;
      let year_part = parse_number(value.get(4..7).unwrap_or(""));
      let year = if year_part < 900 {
        year_part + 2000
      } else {
        year_part + 1000
      };
      if !valid_date(
        i32::try_from(year).unwrap_or(0),
        parse_number(value.get(2..4).unwrap_or("")),
        parse_number(value.get(..2).unwrap_or("")),
      ) {
        return Err(invalid_component());
      }
      let check = (11
        - weighted_sum(
          value.get(..12).unwrap_or(""),
          &[7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
        ) % 11)
        % 11
        % 10;
      if check != digit(&value, 12) {
        return Err(invalid_checksum());
      }
    }
    "bd.nid" => {
      check_structure(&value, &[10, 13, 17])?;
      if value.len() == 10 {
        if value.starts_with('0') {
          return Err(invalid_component());
        }
      } else {
        let offset = usize::from(value.len() == 17) * 4;
        if !matches!(
          value.as_bytes().get(offset + 2),
          Some(b'1' | b'2' | b'3' | b'4' | b'5' | b'9')
        ) {
          return Err(invalid_component());
        }
      }
    }
    "be.bis" => {
      check_structure(&value, &[11])?;
      if value.bytes().all(|byte| byte == b'0') {
        return Err(invalid_format());
      }
      let base = parse_number(value.get(..9).unwrap_or(""));
      let check = parse_number(value.get(9..).unwrap_or(""));
      let yy = parse_number(value.get(..2).unwrap_or(""));
      let valid_checksum = 97 - base % 97 == check
        || (i32::try_from(yy).unwrap_or(i32::MAX) + 2000 <= current_year()
          && 97
            - parse_number(&format!("2{}", value.get(..9).unwrap_or(""))) % 97
            == check);
      if !valid_checksum {
        return Err(invalid_checksum());
      }
      let month = parse_number(value.get(2..4).unwrap_or(""));
      if !(20..=32).contains(&month) && !(40..=52).contains(&month) {
        return Err(invalid_component());
      }
    }
    "bg.egn" => {
      check_structure(&value, &[10])?;
      let yy = parse_number(value.get(..2).unwrap_or(""));
      let raw_month = parse_number(value.get(2..4).unwrap_or(""));
      let day = parse_number(value.get(4..6).unwrap_or(""));
      let (year, month) = if raw_month > 40 {
        (2000 + yy, raw_month - 40)
      } else if raw_month > 20 {
        (1800 + yy, raw_month - 20)
      } else {
        (1900 + yy, raw_month)
      };
      if !valid_date(i32::try_from(year).unwrap_or(0), month, day) {
        return Err(invalid_component());
      }
      let check = weighted_sum(
        value.get(..9).unwrap_or(""),
        &[2, 4, 8, 5, 10, 9, 7, 3, 6],
      ) % 11
        % 10;
      if check != digit(&value, 9) {
        return Err(invalid_checksum());
      }
    }
    "bg.pnf" => {
      check_structure(&value, &[10])?;
      if weighted_sum(
        value.get(..9).unwrap_or(""),
        &[21, 19, 17, 13, 11, 9, 7, 3, 1],
      ) % 10
        != digit(&value, 9)
      {
        return Err(invalid_checksum());
      }
    }
    "bh.cpr" => {
      check_structure(&value, &[9])?;
      if !(1..=12).contains(&parse_number(value.get(2..4).unwrap_or(""))) {
        return Err(invalid_component());
      }
    }
    "by.unp" => validate_by_unp(&value)?,
    "bz.tin" => {
      check_structure(&value, &[6, 8])?;
      if value.len() == 8
        && !["10", "13", "66"].contains(&value.get(6..).unwrap_or(""))
      {
        return Err(invalid_component());
      }
    }
    "ca.bn" => {
      if ![9, 15].contains(&value.len()) {
        return Err(invalid_length());
      }
      if !value.get(..9).is_some_and(is_digits)
        || (value.len() == 15 && !value.get(11..).is_some_and(is_digits))
      {
        return Err(invalid_format());
      }
      if !luhn_valid(value.get(..9).unwrap_or("")) {
        return Err(invalid_checksum());
      }
      if value.len() == 15
        && !["RC", "RM", "RP", "RT"].contains(&value.get(9..11).unwrap_or(""))
      {
        return Err(invalid_component());
      }
    }
    "ca.sin" => {
      check_structure(&value, &[9])?;
      if matches!(value.as_bytes().first(), Some(b'0' | b'8')) {
        return Err(invalid_component());
      }
      if !luhn_valid(&value) {
        return Err(invalid_checksum());
      }
    }
    "ch.ssn" => {
      check_structure(&value, &[13])?;
      if !value.starts_with("756") {
        return Err(invalid_component());
      }
      let sum = value.get(..12).unwrap_or("").bytes().enumerate().fold(
        0_u32,
        |sum, (index, byte)| {
          sum + u32::from(byte - b'0') * if index % 2 == 0 { 1 } else { 3 }
        },
      );
      if (10 - sum % 10) % 10 != digit(&value, 12) {
        return Err(invalid_checksum());
      }
    }
    "ch.vat" => validate_ch_vat(&value)?,
    "cl.rut" => {
      if ![8, 9].contains(&value.len()) {
        return Err(invalid_length());
      }
      let body = value.get(..value.len().saturating_sub(1)).unwrap_or("");
      if !is_digits(body)
        || !value
          .as_bytes()
          .last()
          .is_some_and(|byte| byte.is_ascii_digit() || *byte == b'K')
      {
        return Err(invalid_format());
      }
      if !value.ends_with(rut_check(body)) {
        return Err(invalid_checksum());
      }
    }
    "cn.uscc" => validate_uscc(&value)?,
    "co.nit" => validate_co_nit(&value)?,
    "cr.cpf" => {
      check_structure(&value, &[10])?;
      if !value.starts_with('0') {
        return Err(invalid_component());
      }
    }
    "cu.ni" => validate_cu_ni(&value)?,
    "cz.ico" => {
      check_structure(&value, &[8])?;
      let raw = (11
        - weighted_sum(value.get(..7).unwrap_or(""), &[8, 7, 6, 5, 4, 3, 2])
          % 11)
        % 11;
      let check = if raw == 0 { 1 } else { raw % 10 };
      if check != digit(&value, 7) {
        return Err(invalid_checksum());
      }
    }
    "de.handelsreg" => validate_handelsreg(&value)?,
    "dk.cvr" => {
      check_structure(&value, &[8])?;
      if value.starts_with('0') {
        return Err(invalid_component());
      }
      if !weighted_sum(&value, &[2, 7, 6, 5, 4, 3, 2, 1]).is_multiple_of(11) {
        return Err(invalid_checksum());
      }
    }
    "do.rnc" => {
      check_structure(&value, &[9, 11])?;
      if value.len() == 11 {
        if !luhn_valid(&value) {
          return Err(invalid_checksum());
        }
      } else {
        let remainder =
          weighted_sum(value.get(..8).unwrap_or(""), &[7, 9, 8, 6, 5, 4, 3, 2])
            % 11;
        if ((10 - remainder) % 9) + 1 != digit(&value, 8) {
          return Err(invalid_checksum());
        }
      }
    }
    _ => return validate_for_e_m(id, &value),
  }
  Ok(value)
}

fn validate_by_unp(value: &str) -> Result<(), ValidationError> {
  if value.len() != 9 {
    return Err(invalid_length());
  }
  if !value.get(2..).is_some_and(is_digits) {
    return Err(invalid_format());
  }
  let bytes = value.as_bytes();
  let first = bytes.first().copied().unwrap_or_default();
  if !b"1234567ABCEHKM".contains(&first) {
    return Err(invalid_component());
  }
  let second = bytes.get(1).copied().unwrap_or_default();
  if !(first.is_ascii_digit() && second.is_ascii_digit()
    || b"ABCEHKMOPT".contains(&first) && b"ABCEHKMOPT".contains(&second))
  {
    return Err(invalid_format());
  }
  let alphabet = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let mapped_second = if first.is_ascii_digit() {
    second
  } else {
    let index = b"ABCEHKMOPT"
      .iter()
      .position(|byte| *byte == second)
      .unwrap_or(255);
    b'0'.saturating_add(u8::try_from(index).unwrap_or(255))
  };
  let mut work = value.as_bytes().to_vec();
  if let Some(slot) = work.get_mut(1) {
    *slot = mapped_second;
  }
  let weights = [29_u32, 23, 19, 17, 13, 7, 5, 3];
  let sum =
    work
      .iter()
      .take(8)
      .zip(weights)
      .fold(0_u32, |sum, (byte, weight)| {
        let position =
          alphabet.iter().position(|item| item == byte).unwrap_or(0);
        sum + u32::try_from(position).unwrap_or(0) * weight
      });
  let check = sum % 11;
  if check > 9 || check != digit(value, 8) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_ch_vat(value: &str) -> Result<(), ValidationError> {
  let suffix = ["MWST", "TVA", "IVA", "TPV"]
    .iter()
    .find(|suffix| value.ends_with(**suffix));
  let Some(suffix) = suffix else {
    return Err(invalid_format());
  };
  let uid = value
    .get(..value.len().saturating_sub(suffix.len()))
    .unwrap_or("");
  if !uid.starts_with("CHE")
    || uid.len() != 12
    || !uid.get(3..).is_some_and(is_digits)
  {
    return Err(invalid_format());
  }
  if crate::validators::ch::uid::VALIDATOR.validate(uid).is_err() {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_uscc(value: &str) -> Result<(), ValidationError> {
  const ALPHABET: &str = "0123456789ABCDEFGHJKLMNPQRTUWXY";
  const WEIGHTS: [u32; 17] = [
    1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28,
  ];
  if value.len() != 18 {
    return Err(invalid_length());
  }
  if !value.chars().all(|character| ALPHABET.contains(character))
    || !value.get(2..8).is_some_and(is_digits)
  {
    return Err(invalid_format());
  }
  let sum = value.chars().take(17).zip(WEIGHTS).fold(
    0_u32,
    |sum, (character, weight)| {
      sum
        + u32::try_from(ALPHABET.find(character).unwrap_or(0)).unwrap_or(0)
          * weight
    },
  );
  let index = usize::try_from((31 - sum % 31) % 31).unwrap_or(0);
  if value.chars().nth(17) != ALPHABET.chars().nth(index) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_co_nit(value: &str) -> Result<(), ValidationError> {
  if !(8..=16).contains(&value.len()) {
    return Err(invalid_length());
  }
  if !is_digits(value) {
    return Err(invalid_format());
  }
  const WEIGHTS: [u32; 15] =
    [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const CHECKS: [u32; 11] = [0, 1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  let body = value.get(..value.len().saturating_sub(1)).unwrap_or("");
  let sum = body
    .bytes()
    .rev()
    .zip(WEIGHTS)
    .fold(0_u32, |sum, (byte, weight)| {
      sum + u32::from(byte - b'0') * weight
    });
  if CHECKS
    .get(usize::try_from(sum % 11).unwrap_or(0))
    .copied()
    .unwrap_or(0)
    != digit(value, value.len().saturating_sub(1))
  {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_cu_ni(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[11])?;
  let century = match value.as_bytes().get(6).copied().unwrap_or_default() {
    b'0'..=b'5' => 1900,
    b'6'..=b'8' => 2000,
    b'9' => 1800,
    _ => return Err(invalid_component()),
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(..2).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(2..4).unwrap_or("")),
    parse_number(value.get(4..6).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  Ok(())
}

fn validate_handelsreg(value: &str) -> Result<(), ValidationError> {
  let Some((kind, number)) = value.split_once(' ') else {
    return Err(invalid_format());
  };
  if !["HRA", "HRB", "GNR", "PR", "VR"].contains(&kind) {
    return Err(invalid_component());
  }
  if number.is_empty() || number.len() > 7 || !is_digits(number) {
    return Err(invalid_format());
  }
  Ok(())
}

fn ee_two_pass(payload: &str) -> u32 {
  let first = weighted_sum(payload, &[1, 2, 3, 4, 5, 6, 7, 8, 9, 1]) % 11;
  if first < 10 {
    return first;
  }
  let second = weighted_sum(payload, &[3, 4, 5, 6, 7, 8, 9, 1, 2, 3]) % 11;
  if second < 10 { second } else { 0 }
}

fn validate_for_e_m(id: &str, value: &str) -> ValidationResult {
  match id {
    "ec.ruc" => validate_ec_ruc(value)?,
    "ee.registrikood" => {
      check_structure(value, &[8])?;
      if !matches!(value.as_bytes().first(), Some(b'1' | b'7' | b'8' | b'9')) {
        return Err(invalid_component());
      }
      if ee_two_pass(value.get(..7).unwrap_or("")) != digit(value, 7) {
        return Err(invalid_checksum());
      }
    }
    "eg.tn" => check_structure(value, &[9])?,
    "eu.vat" => validate_eu_vat(value)?,
    "fr.nif" => {
      check_structure(value, &[13])?;
      if !matches!(value.as_bytes().first(), Some(b'0'..=b'3')) {
        return Err(invalid_component());
      }
      if parse_number(value.get(..10).unwrap_or("")) % 511
        != parse_number(value.get(10..).unwrap_or(""))
      {
        return Err(invalid_checksum());
      }
    }
    "gb.sedol" => validate_sedol(value)?,
    "gb.utr" => {
      check_structure(value, &[10])?;
      let remainder = weighted_sum(
        value.get(1..).unwrap_or(""),
        &[6, 7, 8, 9, 10, 5, 4, 3, 2],
      ) % 11;
      if value.as_bytes().first().copied()
        != b"21987654321"
          .get(usize::try_from(remainder).unwrap_or(0))
          .copied()
      {
        return Err(invalid_checksum());
      }
    }
    "ge.pin" => check_structure(value, &[9, 11])?,
    "gh.tin" => validate_gh_tin(value)?,
    "gr.amka" => {
      check_structure(value, &[11])?;
      let dd = parse_number(value.get(..2).unwrap_or(""));
      let mm = parse_number(value.get(2..4).unwrap_or(""));
      let yy = parse_number(value.get(4..6).unwrap_or(""));
      if !valid_date(1900 + i32::try_from(yy).unwrap_or(0), mm, dd)
        && !valid_date(2000 + i32::try_from(yy).unwrap_or(0), mm, dd)
      {
        return Err(invalid_component());
      }
      if !luhn_valid(value) {
        return Err(invalid_checksum());
      }
    }
    "gt.nit" => validate_gt_nit(value)?,
    "hk.hkid" => validate_hkid(value)?,
    "id.npwp" => validate_npwp(value)?,
    "il.idnr" => {
      if value.len() > 9 {
        return Err(invalid_length());
      }
      if !is_digits(value) || value.bytes().all(|byte| byte == b'0') {
        return Err(invalid_format());
      }
      if !luhn_valid(value) {
        return Err(invalid_checksum());
      }
    }
    "in.aadhaar" => validate_aadhaar(value)?,
    "in.gstin" => validate_gstin(value)?,
    "in.pan" => validate_pan(value)?,
    "iq.nid" => check_structure(value, &[12])?,
    "ir.nid" => validate_ir_nid(value)?,
    "is.kennitala" => validate_kennitala(value)?,
    "is.vsk" => check_structure(value, &[5, 6])?,
    "jp.cn" => {
      check_structure(value, &[13])?;
      let payload = value.get(1..).unwrap_or("");
      let sum =
        payload
          .bytes()
          .rev()
          .enumerate()
          .fold(0_u32, |sum, (index, byte)| {
            sum + u32::from(byte - b'0') * if index % 2 == 0 { 1 } else { 2 }
          });
      if 9 - sum % 9 != digit(value, 0) {
        return Err(invalid_checksum());
      }
    }
    "jp.mynumber" => {
      check_structure(value, &[12])?;
      let remainder = weighted_sum(
        value.get(..11).unwrap_or(""),
        &[6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
      ) % 11;
      let expected = if remainder <= 1 { 0 } else { 11 - remainder };
      if expected != digit(value, 11) {
        return Err(invalid_checksum());
      }
    }
    "kr.brn" => {
      check_structure(value, &[10])?;
      if value.get(..3).unwrap_or("") < "101"
        || value.get(3..5) == Some("00")
        || value.get(5..9) == Some("0000")
      {
        return Err(invalid_component());
      }
    }
    "kr.rrn" => validate_kr_rrn(value)?,
    "kw.civil" => validate_kw_civil(value)?,
    "kz.iin" => validate_kz_iin(value)?,
    "li.peid" => {
      if !(4..=12).contains(&value.len()) {
        return Err(invalid_length());
      }
      if !is_digits(value) {
        return Err(invalid_format());
      }
    }
    "lk.nic" => validate_lk_nic(value)?,
    "ma.ice" => {
      check_structure(value, &[15])?;
      if mod97(value) != 0 {
        return Err(invalid_checksum());
      }
    }
    "mc.tva" => validate_mc_tva(value)?,
    "md.idno" => {
      if !is_digits(value) {
        return Err(invalid_format());
      }
      if value.len() != 13 {
        return Err(invalid_length());
      }
      if weighted_sum(
        value.get(..12).unwrap_or(""),
        &[7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1],
      ) % 10
        != digit(value, 12)
      {
        return Err(invalid_checksum());
      }
    }
    "me.pib" => {
      check_structure(value, &[8])?;
      let check = (11
        - weighted_sum(value.get(..7).unwrap_or(""), &[8, 7, 6, 5, 4, 3, 2])
          % 11)
        % 11
        % 10;
      if check != digit(value, 7) {
        return Err(invalid_checksum());
      }
    }
    "mk.edb" => {
      check_structure(value, &[13])?;
      let check = (11
        - weighted_sum(
          value.get(..12).unwrap_or(""),
          &[7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2],
        ) % 11)
        % 11
        % 10;
      if check != digit(value, 12) {
        return Err(invalid_checksum());
      }
    }
    "mu.brn" => validate_mu_brn(value)?,
    "mx.clabe" => validate_clabe(value)?,
    "mx.curp" => validate_curp(value)?,
    "mx.rfc" => validate_rfc(value)?,
    "my.nric" => validate_my_nric(value)?,
    _ => return Err(invalid_format()),
  }
  Ok(value.to_owned())
}

fn validate_ec_ruc(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[13])?;
  let province = value.get(..2).unwrap_or("");
  if !("01"..="24").contains(&province) && province != "30" && province != "50"
  {
    return Err(invalid_component());
  }
  let kind = digit(value, 2);
  let natural = value.get(10..).unwrap_or("") != "000"
    && value
      .get(..10)
      .unwrap_or("")
      .bytes()
      .enumerate()
      .fold(0_u32, |sum, (index, byte)| {
        let mut product =
          u32::from(byte - b'0') * if index % 2 == 0 { 2 } else { 1 };
        if product > 9 {
          product -= 9;
        }
        sum + product
      })
      .is_multiple_of(10);
  let public = value.get(9..).unwrap_or("") != "0000"
    && weighted_sum(value, &[3, 2, 7, 6, 5, 4, 3, 2, 1]).is_multiple_of(11);
  let juridical = value.get(10..).unwrap_or("") != "000"
    && weighted_sum(value, &[4, 3, 2, 7, 6, 5, 4, 3, 2, 1]).is_multiple_of(11);
  let valid = match kind {
    0..=5 => natural,
    6 => public || natural,
    9 => public || juridical,
    _ => return Err(invalid_component()),
  };
  if !valid {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_sedol(value: &str) -> Result<(), ValidationError> {
  const ALPHABET: &str = "0123456789 BCD FGH JKLMN PQRST VWXYZ";
  if value.len() != 7 {
    return Err(invalid_length());
  }
  if !value.chars().all(|character| ALPHABET.contains(character))
    || (value.as_bytes().first().is_some_and(u8::is_ascii_digit)
      && !is_digits(value))
  {
    return Err(invalid_format());
  }
  let sum = value.chars().take(6).zip([1_u32, 3, 1, 7, 3, 9]).fold(
    0_u32,
    |sum, (character, weight)| {
      sum
        + u32::try_from(ALPHABET.find(character).unwrap_or(0)).unwrap_or(0)
          * weight
    },
  );
  if (10 - sum % 10) % 10 != digit(value, 6) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_gh_tin(value: &str) -> Result<(), ValidationError> {
  if value.len() != 11 {
    return Err(invalid_length());
  }
  let bytes = value.as_bytes();
  if !bytes.first().is_some_and(|byte| b"PCGQV".contains(byte))
    || value.get(1..3) != Some("00")
    || !value.get(3..10).is_some_and(is_digits)
    || !bytes
      .last()
      .is_some_and(|byte| byte.is_ascii_digit() || *byte == b'X')
  {
    return Err(invalid_format());
  }
  let check = (1_usize..=9).fold(0_u32, |sum, index| {
    sum + u32::try_from(index).unwrap_or(0) * digit(value, index)
  }) % 11;
  let expected = if check == 10 {
    'X'
  } else {
    char::from_digit(check, 10).unwrap_or('0')
  };
  if !value.ends_with(expected) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_gt_nit(value: &str) -> Result<(), ValidationError> {
  if !(2..=12).contains(&value.len()) {
    return Err(invalid_length());
  }
  let body = value.get(..value.len().saturating_sub(1)).unwrap_or("");
  if !is_digits(body)
    || !value
      .as_bytes()
      .last()
      .is_some_and(|byte| byte.is_ascii_digit() || *byte == b'K')
  {
    return Err(invalid_format());
  }
  let length = body.len();
  let sum = body.bytes().enumerate().fold(0_u32, |sum, (index, byte)| {
    sum
      + u32::from(byte - b'0')
        * u32::try_from(length.saturating_sub(index).saturating_add(1))
          .unwrap_or(0)
  });
  let remainder = (11 - sum % 11) % 11;
  let expected = if remainder == 10 {
    'K'
  } else {
    char::from_digit(remainder, 10).unwrap_or('0')
  };
  if !value.ends_with(expected) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_hkid(value: &str) -> Result<(), ValidationError> {
  if ![8, 9].contains(&value.len()) {
    return Err(invalid_length());
  }
  let prefix_len = value.len().saturating_sub(7);
  if !value.get(..prefix_len).is_some_and(is_upper)
    || !value.get(prefix_len..prefix_len + 6).is_some_and(is_digits)
    || !value
      .as_bytes()
      .last()
      .is_some_and(|byte| byte.is_ascii_digit() || *byte == b'A')
  {
    return Err(invalid_format());
  }
  let body = value.get(..value.len().saturating_sub(1)).unwrap_or("");
  let padded = if body.len() == 7 {
    format!(" {body}")
  } else {
    body.to_owned()
  };
  let sum = padded
    .bytes()
    .enumerate()
    .fold(0_u32, |sum, (index, byte)| {
      let number = if byte == b' ' {
        36
      } else if byte.is_ascii_uppercase() {
        u32::from(byte - b'A') + 10
      } else {
        u32::from(byte - b'0')
      };
      sum + number * u32::try_from(9_usize.saturating_sub(index)).unwrap_or(0)
    });
  let expected = match sum % 11 {
    0 => '0',
    1 => 'A',
    remainder => char::from_digit(11 - remainder, 10).unwrap_or('0'),
  };
  if !value.ends_with(expected) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_eu_vat(value: &str) -> Result<(), ValidationError> {
  if value.len() < 3 || !value.get(..2).is_some_and(is_upper) {
    return Err(invalid_format());
  }
  let country = value.get(..2).unwrap_or("");
  let rest = value.get(2..).unwrap_or("");
  let validator_id = match country {
    "AT" => "at.uid",
    "BE" => "be.vat",
    "BG" => "bg.vat",
    "CY" => "cy.vat",
    "CZ" => "cz.dic",
    "DE" => "de.vat",
    "DK" => "dk.vat",
    "EE" => "ee.vat",
    "EL" | "GR" => "gr.vat",
    "ES" => "es.vat",
    "FI" => "fi.vat",
    "FR" => "fr.tva",
    "HR" => "hr.vat",
    "HU" => "hu.vat",
    "IE" => "ie.vat",
    "IT" => "it.iva",
    "LT" => "lt.vat",
    "LU" => "lu.vat",
    "LV" => "lv.vat",
    "MT" => "mt.vat",
    "NL" => "nl.vat",
    "PL" => "pl.nip",
    "PT" => "pt.vat",
    "RO" => "ro.vat",
    "SE" => "se.vat",
    "SI" => "si.vat",
    "SK" => "sk.dic",
    "XI" => "gb.vat",
    _ => return Err(invalid_component()),
  };
  let Some(validator) = crate::validator(validator_id) else {
    return Err(invalid_component());
  };
  validator.validate(rest).map(|_| ())
}

fn check_digit_for(id: &str, value: &str) -> Option<u32> {
  if id != "gb.sedol" || value.len() != 6 {
    return None;
  }
  const ALPHABET: &str = "0123456789 BCD FGH JKLMN PQRST VWXYZ";
  if !value.chars().all(|character| ALPHABET.contains(character)) {
    return None;
  }
  let sum = value.chars().zip([1_u32, 3, 1, 7, 3, 9]).fold(
    0_u32,
    |sum, (character, weight)| {
      sum
        + u32::try_from(ALPHABET.find(character).unwrap_or(0)).unwrap_or(0)
          * weight
    },
  );
  Some((10 - sum % 10) % 10)
}

fn validate_npwp(value: &str) -> Result<(), ValidationError> {
  if !is_digits(value) {
    return Err(invalid_format());
  }
  if value.len() == 15 {
    if !luhn_valid(value.get(..9).unwrap_or("")) {
      return Err(invalid_checksum());
    }
    return Ok(());
  }
  if value.len() != 16 {
    return Err(invalid_length());
  }
  if value.starts_with('0') {
    if !luhn_valid(value.get(..10).unwrap_or("")) {
      return Err(invalid_checksum());
    }
    return Ok(());
  }
  const PROVINCES: &[&str] = &[
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "31", "32",
    "33", "34", "35", "36", "51", "52", "53", "61", "62", "63", "64", "71",
    "72", "73", "74", "75", "76", "81", "82", "91", "94",
  ];
  if !PROVINCES.contains(&value.get(..2).unwrap_or("")) {
    return Err(invalid_component());
  }
  let mut day = parse_number(value.get(6..8).unwrap_or(""));
  if day > 40 {
    day -= 40;
  }
  let month = parse_number(value.get(8..10).unwrap_or(""));
  let yy =
    i32::try_from(parse_number(value.get(10..12).unwrap_or(""))).unwrap_or(0);
  if !valid_date(1900 + yy, month, day) && !valid_date(2000 + yy, month, day) {
    return Err(invalid_component());
  }
  Ok(())
}

fn verhoeff_valid(value: &str) -> bool {
  const D: [[usize; 10]; 10] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const P: [[usize; 10]; 8] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  let mut check = 0_usize;
  for (position, byte) in value.bytes().rev().enumerate() {
    let number = usize::from(byte.saturating_sub(b'0'));
    check = D
      .get(check)
      .and_then(|row| {
        P.get(position % 8)
          .and_then(|permutation| permutation.get(number))
          .and_then(|mapped| row.get(*mapped))
      })
      .copied()
      .unwrap_or(1);
  }
  check == 0
}

fn validate_aadhaar(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[12])?;
  if matches!(value.as_bytes().first(), Some(b'0' | b'1')) {
    return Err(invalid_component());
  }
  if value.bytes().eq(value.bytes().rev()) {
    return Err(invalid_format());
  }
  if !verhoeff_valid(value) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn base36(byte: u8) -> Option<u32> {
  if byte.is_ascii_digit() {
    Some(u32::from(byte - b'0'))
  } else if byte.is_ascii_uppercase() {
    Some(u32::from(byte - b'A') + 10)
  } else {
    None
  }
}

fn validate_gstin(value: &str) -> Result<(), ValidationError> {
  if value.len() != 15 {
    return Err(invalid_length());
  }
  let bytes = value.as_bytes();
  let structure = bytes
    .get(..2)
    .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    && bytes
      .get(2..7)
      .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
    && bytes
      .get(7..11)
      .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    && bytes.get(11).is_some_and(u8::is_ascii_uppercase)
    && bytes.get(12).is_some_and(u8::is_ascii_alphanumeric)
    && bytes.get(13) == Some(&b'Z')
    && bytes.get(14).is_some_and(u8::is_ascii_alphanumeric);
  if !structure {
    return Err(invalid_format());
  }
  let state = parse_number(value.get(..2).unwrap_or(""));
  if !(1..=37).contains(&state) || bytes.get(12) == Some(&b'0') {
    return Err(invalid_component());
  }
  let mut sum = 0_u32;
  let mut double = false;
  for byte in bytes.iter().rev().copied() {
    let Some(mut number) = base36(byte) else {
      return Err(invalid_format());
    };
    if double {
      number *= 2;
      sum += number / 36 + number % 36;
    } else {
      sum += number;
    }
    double = !double;
  }
  if !sum.is_multiple_of(36) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_pan(value: &str) -> Result<(), ValidationError> {
  if value.len() != 10 {
    return Err(invalid_length());
  }
  let bytes = value.as_bytes();
  if !bytes
    .get(..5)
    .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
    || !bytes
      .get(5..9)
      .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    || !bytes.last().is_some_and(u8::is_ascii_uppercase)
  {
    return Err(invalid_format());
  }
  if !bytes
    .get(3)
    .is_some_and(|byte| b"ABCFGHLJPT".contains(byte))
  {
    return Err(invalid_component());
  }
  Ok(())
}

fn validate_ir_nid(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[10])?;
  if value
    .bytes()
    .all(|byte| byte == value.as_bytes().first().copied().unwrap_or_default())
  {
    return Err(invalid_format());
  }
  let remainder =
    weighted_sum(value.get(..9).unwrap_or(""), &[10, 9, 8, 7, 6, 5, 4, 3, 2])
      % 11;
  let expected = if remainder < 2 {
    remainder
  } else {
    11 - remainder
  };
  if expected != digit(value, 9) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_kennitala(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[10])?;
  let remainder = (11
    - weighted_sum(value.get(..8).unwrap_or(""), &[3, 2, 7, 6, 5, 4, 3, 2])
      % 11)
    % 11;
  if remainder == 10 || remainder != digit(value, 8) {
    return Err(invalid_checksum());
  }
  let mut day = parse_number(value.get(..2).unwrap_or(""));
  if day > 40 {
    day -= 40;
  }
  let century = match value.as_bytes().get(9) {
    Some(b'9') => 1900,
    Some(b'0') => 2000,
    _ => return Err(invalid_component()),
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(4..6).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(2..4).unwrap_or("")),
    day,
  ) {
    return Err(invalid_component());
  }
  Ok(())
}

fn validate_kr_rrn(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[13])?;
  let century = match value.as_bytes().get(6).copied().unwrap_or_default() {
    b'0' | b'9' => 1800,
    b'1' | b'2' | b'5' | b'6' => 1900,
    b'3' | b'4' | b'7' | b'8' => 2000,
    _ => return Err(invalid_component()),
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(..2).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(2..4).unwrap_or("")),
    parse_number(value.get(4..6).unwrap_or("")),
  ) || parse_number(value.get(7..9).unwrap_or("")) > 96
  {
    return Err(invalid_component());
  }
  let check = (11
    - weighted_sum(
      value.get(..12).unwrap_or(""),
      &[2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5],
    ) % 11)
    % 10;
  if check != digit(value, 12) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_kw_civil(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[12])?;
  let century = match value.as_bytes().first() {
    Some(b'2') => 1900,
    Some(b'3') => 2000,
    _ => return Err(invalid_component()),
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(1..3).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(3..5).unwrap_or("")),
    parse_number(value.get(5..7).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  let check = (11
    - weighted_sum(
      value.get(..11).unwrap_or(""),
      &[2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2],
    ) % 11)
    % 11;
  if check != digit(value, 11) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_kz_iin(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[12])?;
  let marker = digit(value, 6);
  let century = match marker {
    1 | 2 => 1800,
    3 | 4 => 1900,
    5 | 6 => 2000,
    _ => return Err(invalid_component()),
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(..2).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(2..4).unwrap_or("")),
    parse_number(value.get(4..6).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  let mut check = weighted_sum(
    value.get(..11).unwrap_or(""),
    &[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  ) % 11;
  if check == 10 {
    check = weighted_sum(
      value.get(..11).unwrap_or(""),
      &[3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2],
    ) % 11;
  }
  if check == 10 {
    check = 0;
  }
  if check != digit(value, 11) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn lk_normalized(value: &str) -> Option<String> {
  if value.len() == 12 && is_digits(value) {
    return Some(value.to_owned());
  }
  if value.len() != 10
    || !value.get(..9).is_some_and(is_digits)
    || !matches!(value.as_bytes().last(), Some(b'V' | b'X'))
  {
    return None;
  }
  Some(format!(
    "19{}{}0{}{}",
    value.get(..2).unwrap_or(""),
    value.get(2..5).unwrap_or(""),
    value.get(5..8).unwrap_or(""),
    value.get(8..9).unwrap_or("")
  ))
}

fn validate_lk_nic(value: &str) -> Result<(), ValidationError> {
  let Some(normalized) = lk_normalized(value) else {
    return Err(if [10, 12].contains(&value.len()) {
      invalid_format()
    } else {
      invalid_length()
    });
  };
  let year =
    i32::try_from(parse_number(normalized.get(..4).unwrap_or(""))).unwrap_or(0);
  let mut ordinal = parse_number(normalized.get(4..7).unwrap_or(""));
  if ordinal > 500 {
    ordinal -= 500;
  }
  if day_of_year_to_date(year, ordinal).is_none() {
    return Err(invalid_component());
  }
  let sum = weighted_sum(
    normalized.get(..11).unwrap_or(""),
    &[8, 4, 3, 2, 7, 6, 5, 7, 4, 3, 2],
  );
  let raw = 11 - sum % 11;
  let check = if raw > 9 { raw % 10 } else { raw };
  if check != digit(&normalized, 11) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_mc_tva(value: &str) -> Result<(), ValidationError> {
  if value.len() != 13 {
    return Err(invalid_length());
  }
  if !value.starts_with("FR") || !value.get(2..).is_some_and(is_digits) {
    return Err(invalid_format());
  }
  let number = value.get(2..).unwrap_or("");
  let key = parse_number(number.get(..2).unwrap_or(""));
  let siren = parse_number(number.get(2..).unwrap_or(""));
  if (12 + 3 * (siren % 97)) % 97 != key {
    return Err(invalid_checksum());
  }
  if !number
    .get(2..)
    .is_some_and(|siren| siren.starts_with("000"))
  {
    return Err(invalid_component());
  }
  Ok(())
}

fn validate_mu_brn(value: &str) -> Result<(), ValidationError> {
  if ![8, 9].contains(&value.len()) {
    return Err(invalid_length());
  }
  if value.len() == 9 {
    if !value.as_bytes().first().is_some_and(u8::is_ascii_uppercase)
      || !value.get(1..).is_some_and(is_digits)
    {
      return Err(invalid_format());
    }
  } else if !is_digits(value)
    || !matches!(value.as_bytes().first(), Some(b'0'..=b'3'))
  {
    return Err(invalid_format());
  }
  Ok(())
}

fn validate_clabe(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[18])?;
  let sum =
    value
      .bytes()
      .take(17)
      .enumerate()
      .fold(0_u32, |sum, (index, byte)| {
        let weight = [3_u32, 7, 1].get(index % 3).copied().unwrap_or(0);
        sum + (u32::from(byte - b'0') * weight) % 10
      });
  if (10 - sum % 10) % 10 != digit(value, 17) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_curp(value: &str) -> Result<(), ValidationError> {
  if value.len() != 18 {
    return Err(invalid_length());
  }
  let bytes = value.as_bytes();
  let format = bytes
    .get(..4)
    .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
    && bytes
      .get(4..10)
      .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    && matches!(bytes.get(10), Some(b'H' | b'M'))
    && bytes
      .get(11..16)
      .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
    && bytes.get(16).is_some_and(u8::is_ascii_alphanumeric)
    && bytes.get(17).is_some_and(u8::is_ascii_digit);
  if !format {
    return Err(invalid_format());
  }
  let century = if bytes.get(16).is_some_and(u8::is_ascii_digit) {
    1900
  } else {
    2000
  };
  if !valid_date(
    century
      + i32::try_from(parse_number(value.get(4..6).unwrap_or(""))).unwrap_or(0),
    parse_number(value.get(6..8).unwrap_or("")),
    parse_number(value.get(8..10).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  const STATES: &[&str] = &[
    "AS", "BC", "BS", "CC", "CL", "CM", "CS", "CH", "DF", "DG", "GT", "GR",
    "HG", "JC", "MC", "MN", "MS", "NT", "NL", "OC", "PL", "QT", "QR", "SP",
    "SL", "SR", "TC", "TS", "TL", "VZ", "YN", "ZS", "NE",
  ];
  if !STATES.contains(&value.get(11..13).unwrap_or("")) {
    return Err(invalid_component());
  }
  const ALPHABET: &str = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ";
  let sum = value.chars().take(17).enumerate().fold(
    0_u32,
    |sum, (index, character)| {
      sum
        + u32::try_from(ALPHABET.find(character).unwrap_or(0)).unwrap_or(0)
          * u32::try_from(18_usize.saturating_sub(index)).unwrap_or(0)
    },
  );
  if (10 - sum % 10) % 10 != digit(value, 17) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_rfc(value: &str) -> Result<(), ValidationError> {
  // RFC permits Ñ in the name prefix. Normalize only
  // that multi-byte character to an unused ASCII
  // sentinel so the common ASCII path stays
  // allocation-free and byte offsets remain safe.
  let normalized = if value.is_ascii() {
    std::borrow::Cow::Borrowed(value)
  } else {
    std::borrow::Cow::Owned(value.replace('Ñ', "^"))
  };
  let value = normalized.as_ref();
  if ![12, 13].contains(&value.len()) {
    return Err(invalid_length());
  }
  let bytes = value.as_bytes();
  let prefix_len = value.len().saturating_sub(9);
  let valid_prefix = bytes.get(..prefix_len).is_some_and(|part| {
    part
      .iter()
      .all(|byte| byte.is_ascii_uppercase() || matches!(*byte, b'&' | b'^'))
  });
  if !valid_prefix
    || !bytes
      .get(prefix_len..prefix_len + 6)
      .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    || !bytes
      .get(prefix_len + 6..)
      .is_some_and(|part| part.iter().all(u8::is_ascii_alphanumeric))
  {
    return Err(invalid_format());
  }
  let yy = i32::try_from(parse_number(
    value.get(prefix_len..prefix_len + 2).unwrap_or(""),
  ))
  .unwrap_or(0);
  if !valid_date(
    2000 + yy,
    parse_number(value.get(prefix_len + 2..prefix_len + 4).unwrap_or("")),
    parse_number(value.get(prefix_len + 4..prefix_len + 6).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  const ALPHABET: &str = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ ^";
  let body = value.get(..value.len().saturating_sub(1)).unwrap_or("");
  let padded = if body.len() == 11 {
    format!(" {body}")
  } else {
    body.to_owned()
  };
  let sum = padded.chars().take(12).enumerate().fold(
    0_u32,
    |sum, (index, character)| {
      sum
        + u32::try_from(ALPHABET.find(character).unwrap_or(0)).unwrap_or(0)
          * u32::try_from(13_usize.saturating_sub(index)).unwrap_or(0)
    },
  );
  let remainder = sum % 11;
  let expected = if remainder == 0 {
    '0'
  } else if 11 - remainder == 10 {
    'A'
  } else {
    char::from_digit(11 - remainder, 10).unwrap_or('0')
  };
  if !value.ends_with(expected) {
    return Err(invalid_checksum());
  }
  Ok(())
}

fn validate_my_nric(value: &str) -> Result<(), ValidationError> {
  check_structure(value, &[12])?;
  let yy =
    i32::try_from(parse_number(value.get(..2).unwrap_or(""))).unwrap_or(0);
  let reference = current_year();
  let century = reference / 100 * 100;
  let candidate = century + yy;
  let year = if candidate > reference {
    candidate - 100
  } else {
    candidate
  };
  if !valid_date(
    year,
    parse_number(value.get(2..4).unwrap_or("")),
    parse_number(value.get(4..6).unwrap_or("")),
  ) {
    return Err(invalid_component());
  }
  let pb = parse_number(value.get(6..8).unwrap_or(""));
  let valid_pb = (1..=16).contains(&pb)
    || (21..=68).contains(&pb)
    || (71..=72).contains(&pb)
    || (74..=79).contains(&pb)
    || (82..=93).contains(&pb)
    || (98..=99).contains(&pb);
  if !valid_pb {
    return Err(invalid_component());
  }
  Ok(())
}

fn generate_for(id: &str, examples: &[&str]) -> String {
  let example = examples
    .get(random_below(examples.len()))
    .copied()
    .unwrap_or("");
  let compact = compact_for(id, example);
  let digit_positions = compact
    .bytes()
    .enumerate()
    .filter_map(|(index, byte)| byte.is_ascii_digit().then_some(index))
    .collect::<Vec<_>>();
  if digit_positions.is_empty() {
    return compact;
  }
  for _ in 0..2_000 {
    let mut candidate = compact.as_bytes().to_vec();
    let edits = 1_usize.saturating_add(random_below(3));
    for _ in 0..edits {
      let Some(position) = digit_positions
        .get(random_below(digit_positions.len()))
        .copied()
      else {
        continue;
      };
      if let Some(byte) = candidate.get_mut(position) {
        *byte =
          b'0'.saturating_add(u8::try_from(random_below(10)).unwrap_or(0));
      }
    }
    let Ok(candidate) = String::from_utf8(candidate) else {
      continue;
    };
    if candidate != compact && validate_for(id, &candidate).is_ok() {
      return candidate;
    }
  }
  compact
}

const fn parse_function(
  id: &str,
) -> Option<fn(&str) -> Option<ParsedIdentifier>> {
  match id.as_bytes() {
    b"ba.jmbg" => Some(parse_ba_jmbg),
    b"bg.egn" => Some(parse_bg_egn),
    b"cu.ni" => Some(parse_cu_ni),
    b"kr.rrn" => Some(parse_kr_rrn),
    b"kw.civil" => Some(parse_kw_civil),
    b"kz.iin" => Some(parse_kz_iin),
    b"lk.nic" => Some(parse_lk_nic),
    b"mx.curp" => Some(parse_mx_curp),
    b"my.nric" => Some(parse_my_nric),
    _ => None,
  }
}

fn parsed_date(
  year: i32,
  month: u32,
  day: u32,
  gender: Option<Gender>,
) -> Option<ParsedIdentifier> {
  Some(ParsedIdentifier {
    birth_date: IsoDate {
      year,
      month: u8::try_from(month).ok()?,
      day: u8::try_from(day).ok()?,
    },
    gender,
  })
}

fn parse_ba_jmbg(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("ba.jmbg", input).ok()?;
  let part = parse_number(value.get(4..7)?);
  let year =
    i32::try_from(if part < 900 { part + 2000 } else { part + 1000 }).ok()?;
  let gender = if parse_number(value.get(9..12)?) < 500 {
    Gender::Male
  } else {
    Gender::Female
  };
  parsed_date(
    year,
    parse_number(value.get(2..4)?),
    parse_number(value.get(..2)?),
    Some(gender),
  )
}

fn parse_bg_egn(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("bg.egn", input).ok()?;
  let yy = parse_number(value.get(..2)?);
  let raw_month = parse_number(value.get(2..4)?);
  let (year, month) = if raw_month > 40 {
    (2000 + yy, raw_month - 40)
  } else if raw_month > 20 {
    (1800 + yy, raw_month - 20)
  } else {
    (1900 + yy, raw_month)
  };
  let gender = if digit(&value, 8).is_multiple_of(2) {
    Gender::Male
  } else {
    Gender::Female
  };
  parsed_date(
    i32::try_from(year).ok()?,
    month,
    parse_number(value.get(4..6)?),
    Some(gender),
  )
}

fn parse_cu_ni(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("cu.ni", input).ok()?;
  let century = match value.as_bytes().get(6)? {
    b'0'..=b'5' => 1900,
    b'6'..=b'8' => 2000,
    b'9' => 1800,
    _ => return None,
  };
  let year = century + i32::try_from(parse_number(value.get(..2)?)).ok()?;
  let gender = if digit(&value, 9).is_multiple_of(2) {
    Gender::Male
  } else {
    Gender::Female
  };
  parsed_date(
    year,
    parse_number(value.get(2..4)?),
    parse_number(value.get(4..6)?),
    Some(gender),
  )
}

fn parse_kr_rrn(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("kr.rrn", input).ok()?;
  let marker = *value.as_bytes().get(6)?;
  let century = match marker {
    b'0' | b'9' => 1800,
    b'1' | b'2' | b'5' | b'6' => 1900,
    b'3' | b'4' | b'7' | b'8' => 2000,
    _ => return None,
  };
  let gender = if matches!(marker, b'1' | b'3' | b'5' | b'7' | b'9') {
    Gender::Male
  } else {
    Gender::Female
  };
  parsed_date(
    century + i32::try_from(parse_number(value.get(..2)?)).ok()?,
    parse_number(value.get(2..4)?),
    parse_number(value.get(4..6)?),
    Some(gender),
  )
}

fn parse_kw_civil(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("kw.civil", input).ok()?;
  let century = if value.starts_with('2') { 1900 } else { 2000 };
  parsed_date(
    century + i32::try_from(parse_number(value.get(1..3)?)).ok()?,
    parse_number(value.get(3..5)?),
    parse_number(value.get(5..7)?),
    None,
  )
}

fn parse_kz_iin(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("kz.iin", input).ok()?;
  let marker = digit(&value, 6);
  let century = match marker {
    1 | 2 => 1800,
    3 | 4 => 1900,
    5 | 6 => 2000,
    _ => return None,
  };
  let gender = if marker.is_multiple_of(2) {
    Gender::Female
  } else {
    Gender::Male
  };
  parsed_date(
    century + i32::try_from(parse_number(value.get(..2)?)).ok()?,
    parse_number(value.get(2..4)?),
    parse_number(value.get(4..6)?),
    Some(gender),
  )
}

fn parse_lk_nic(input: &str) -> Option<ParsedIdentifier> {
  let original = validate_for("lk.nic", input).ok()?;
  let value = lk_normalized(&original)?;
  let year = i32::try_from(parse_number(value.get(..4)?)).ok()?;
  let mut ordinal = parse_number(value.get(4..7)?);
  let gender = if ordinal > 500 {
    ordinal -= 500;
    Gender::Female
  } else {
    Gender::Male
  };
  let date = day_of_year_to_date(year, ordinal)?;
  Some(ParsedIdentifier {
    birth_date: date,
    gender: Some(gender),
  })
}

fn parse_mx_curp(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("mx.curp", input).ok()?;
  let century = if value.as_bytes().get(16)?.is_ascii_digit() {
    1900
  } else {
    2000
  };
  let gender = if value.as_bytes().get(10) == Some(&b'H') {
    Gender::Male
  } else {
    Gender::Female
  };
  parsed_date(
    century + i32::try_from(parse_number(value.get(4..6)?)).ok()?,
    parse_number(value.get(6..8)?),
    parse_number(value.get(8..10)?),
    Some(gender),
  )
}

fn parse_my_nric(input: &str) -> Option<ParsedIdentifier> {
  let value = validate_for("my.nric", input).ok()?;
  let reference = current_year();
  let candidate = reference / 100 * 100
    + i32::try_from(parse_number(value.get(..2)?)).ok()?;
  let year = if candidate > reference {
    candidate - 100
  } else {
    candidate
  };
  let gender = if digit(&value, 11).is_multiple_of(2) {
    Gender::Female
  } else {
    Gender::Male
  };
  parsed_date(
    year,
    parse_number(value.get(2..4)?),
    parse_number(value.get(4..6)?),
    Some(gender),
  )
}

validator!(
  ad_nrt,
  "ad.nrt",
  CountryCode::Ad,
  EntityType::Any,
  "Andorra Tax Number",
  "Número de Registre Tributari",
  "NRT",
  r"[A-Z]-?\d{6}-?[A-Z]",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Andorra-TIN.pdf",
  &[],
  &["U132950X", "D059888N", "F123456M"],
  &["NRT", "Número de Registre Tributari"]
);
validator!(
  ae_eid,
  "ae.eid",
  CountryCode::Ae,
  EntityType::Person,
  "Emirates ID",
  "رقم الهوية",
  "EID",
  r"784-\d{4}-\d{7}-\d",
  "https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id",
  &[15],
  &[
    "784198012345678",
    "784197912345671",
    "784195204640486",
    "784196865703050"
  ],
  &["EID", "Emirates ID", "رقم الهوية"]
);
validator!(
  ai_tin,
  "ai.tin",
  CountryCode::Ai,
  EntityType::Any,
  "Anguilla Tax Identification Number",
  "Tax Identification Number",
  "TIN",
  r"\d{11}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Anguilla-TIN.pdf",
  &[10],
  &["1234567890", "2345678901"],
  &["TIN"]
);
validator!(
  al_nipt,
  "al.nipt",
  CountryCode::Al,
  EntityType::Any,
  "Albanian Tax Number",
  "Numri i Identifikimit për Personin e Tatueshëm",
  "NIPT",
  r"[A-Z]\d{8}[A-Z]",
  "https://www.tatime.gov.al/",
  &[],
  &["J91402501L", "K22218003V"],
  &["NIPT", "NUIS"]
);
validator!(
  am_tin,
  "am.tin",
  CountryCode::Am,
  EntityType::Any,
  "Armenian Tax ID",
  "Հարկ վճարողի հաշվառման համար",
  "TIN",
  r"\d{8}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Armenia-TIN.pdf",
  &[8],
  &["01234561", "10048376"],
  &["ՀՎՀՀ", "TIN"]
);
validator!(
  ar_cbu,
  "ar.cbu",
  CountryCode::Ar,
  EntityType::Any,
  "Argentine Bank Account Number",
  "Clave Bancaria Uniforme",
  "CBU",
  r"\d{22}",
  "https://es.wikipedia.org/wiki/Clave_bancaria_uniforme",
  &[22],
  &["2850590940090418135201"],
  &["CBU", "Clave Bancaria Uniforme"]
);
validator!(
  ar_cuit,
  "ar.cuit",
  CountryCode::Ar,
  EntityType::Any,
  "Argentine Tax ID",
  "Clave Única de Identificación Tributaria",
  "CUIT",
  r"\d{2}-?\d{8}-?\d",
  "https://www.afip.gob.ar/",
  &[11],
  &["20267565393", "20055361682"],
  &["CUIT", "CUIL", "Clave Única de Identificación Tributaria"]
);
validator!(
  ar_dni,
  "ar.dni",
  CountryCode::Ar,
  EntityType::Person,
  "Argentine Identity Card",
  "Documento Nacional de Identidad",
  "DNI",
  r"\d{1,2}\.?\d{3}\.?\d{3}",
  "https://en.wikipedia.org/wiki/Documento_Nacional_de_Identidad_(Argentina)",
  &[7, 8],
  &["20123456", "12345678"],
  &[
    "DNI",
    "Documento Nacional de Identidad",
    "Documento de Identidad"
  ]
);
validator!(
  at_vnr,
  "at.vnr",
  CountryCode::At,
  EntityType::Person,
  "Austrian Social Insurance Number",
  "Versicherungsnummer",
  "VNR",
  r"\d{4}\s?\d{6}",
  "https://de.wikipedia.org/wiki/Sozialversicherungsnummer",
  &[10],
  &["1237010180"],
  &[
    "VNR",
    "SVNR",
    "Versicherungsnummer",
    "Sozialversicherungsnummer"
  ]
);
validator!(
  au_tfn,
  "au.tfn",
  CountryCode::Au,
  EntityType::Person,
  "Tax File Number",
  "Tax File Number",
  "TFN",
  r"\d{8,9}",
  "https://www.ato.gov.au/individuals-and-families/tax-file-number",
  &[],
  &["87650006", "123456782"],
  &["TFN", "Tax File Number"]
);
validator!(
  az_voen,
  "az.voen",
  CountryCode::Az,
  EntityType::Any,
  "Azerbaijani Tax ID",
  "Vergi Ödəyicisinin Eyniləşdirmə Nömrəsi",
  "VÖEN",
  r"\d{10}",
  "https://www.taxes.gov.az/",
  &[10],
  &["1401555071", "1400057421"],
  &["VÖEN"]
);
validator!(
  ba_jmbg,
  "ba.jmbg",
  CountryCode::Ba,
  EntityType::Person,
  "Bosnian Personal ID",
  "Jedinstveni matični broj građana",
  "JMBG",
  r"\d{13}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/",
  &[13],
  &["0101006500006"],
  &["JMBG", "matični broj"]
);
validator!(
  bd_nid,
  "bd.nid",
  CountryCode::Bd,
  EntityType::Person,
  "National Identity Number",
  "জাতীয় পরিচয়পত্র",
  "NID",
  r"\d{10,17}",
  "https://www.nidw.gov.bd/",
  &[10, 13, 17],
  &[
    "1592824588424",
    "19841592824588424",
    "2610413965404",
    "19892610413965404"
  ],
  &["NID", "জাতীয় পরিচয়পত্র", "National ID Card"]
);
validator!(
  be_bis,
  "be.bis",
  CountryCode::Be,
  EntityType::Person,
  "Belgian BIS Number",
  "BIS-nummer",
  "BIS",
  r"\d{2}\.?\d{2}\.?\d{2}-?\d{3}\.?\d{2}",
  "https://sma-help.bosa.belgium.be/en/faq/where-can-i-find-my-bis-number",
  &[],
  &["98472899765"],
  &["BIS-nummer", "numéro BIS"]
);
validator!(
  bg_egn,
  "bg.egn",
  CountryCode::Bg,
  EntityType::Person,
  "Bulgarian Personal ID",
  "Единен граждански номер",
  "ЕГН",
  r"\d{10}",
  "https://www.grao.bg/normact/NaredbaFunkcESGR.pdf",
  &[],
  &["7523169263"],
  &["ЕГН", "единен граждански номер", "EGN"]
);
validator!(
  bg_pnf,
  "bg.pnf",
  CountryCode::Bg,
  EntityType::Person,
  "Bulgarian Foreigner Number",
  "Личен номер на чужденец",
  "ЛНЧ",
  r"\d{10}",
  "https://en.wikipedia.org/wiki/Unique_citizenship_number",
  &[],
  &["7111042925"],
  &["ЛНЧ", "личен номер на чужденец", "PNF"]
);
validator!(
  bh_cpr,
  "bh.cpr",
  CountryCode::Bh,
  EntityType::Person,
  "Central Population Registration Number",
  "الرقم السكاني",
  "CPR",
  r"\d{9}",
  "https://www.bahrain.bh/wps/portal/IDInfo_en",
  &[9],
  &["890112345", "000612345"],
  &["CPR", "الرقم السكاني"]
);
validator!(
  by_unp,
  "by.unp",
  CountryCode::By,
  EntityType::Any,
  "Belarus Tax Number",
  "Учётный номер плательщика",
  "УНП",
  r"\d{9}",
  "https://www.nalog.gov.by/",
  &[],
  &["200988541", "MA1953684"],
  &["УНП", "UNP"]
);
validator!(
  bz_tin,
  "bz.tin",
  CountryCode::Bz,
  EntityType::Any,
  "Belize Tax Identification Number",
  "Tax Identification Number",
  "TIN",
  r"\d{6}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Belize-TIN.pdf",
  &[6, 8],
  &["000005", "00000510", "00000513"],
  &["TIN"]
);
validator!(
  ca_bn,
  "ca.bn",
  CountryCode::Ca,
  EntityType::Company,
  "Business Number",
  "Business Number",
  "BN",
  r"\d{9}\s?[A-Z]{2}\s?\d{4}",
  "https://www.canada.ca/en/services/taxes/business-number.html",
  &[],
  &["123026635", "123026635RC0001"],
  &["BN", "Business Number", "numéro d'entreprise"]
);
validator!(
  ca_sin,
  "ca.sin",
  CountryCode::Ca,
  EntityType::Person,
  "Social Insurance Number",
  "Social Insurance Number",
  "SIN",
  r"\d{3}-?\d{3}-?\d{3}",
  "https://www.canada.ca/en/employment-social-development/services/sin.html",
  &[],
  &["123456782"],
  &["SIN", "Social Insurance Number", "NAS"]
);
validator!(
  ch_ssn,
  "ch.ssn",
  CountryCode::Ch,
  EntityType::Person,
  "Swiss Social Security Number",
  "AHV-Versichertennummer",
  "AHV",
  r"756\.?\d{4}\.?\d{4}\.?\d{2}",
  "https://www.bsv.admin.ch/",
  &[],
  &["7561234567897"],
  &["AHV-Nummer", "numéro AVS", "AVS", "AHV"]
);
validator!(
  ch_vat,
  "ch.vat",
  CountryCode::Ch,
  EntityType::Company,
  "Swiss VAT Number",
  "Mehrwertsteuernummer",
  "MWST",
  r"CHE-?\d{3}\.?\d{3}\.?\d{3}\s?(?:MWST|TVA|IVA)",
  "https://www.estv.admin.ch/",
  &[],
  &["CHE107787577IVA"],
  &["MWST", "TVA", "IVA"]
);
validator!(
  cl_rut,
  "cl.rut",
  CountryCode::Cl,
  EntityType::Any,
  "Chilean Tax ID",
  "Rol Único Tributario",
  "RUT",
  r"\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]",
  "https://www.sii.cl/",
  &[8, 9],
  &["760864285", "125319092"],
  &["RUT", "Rol Único Tributario"]
);
validator!(
  cn_uscc,
  "cn.uscc",
  CountryCode::Cn,
  EntityType::Company,
  "Unified Social Credit Code",
  "统一社会信用代码",
  "USCC",
  r"[0-9A-HJ-NP-RTUW-Y]{2}\d{6}[0-9A-HJ-NP-RTUW-Y]{10}",
  "https://zh.wikipedia.org/wiki/统一社会信用代码",
  &[18],
  &["91110000600037341L"],
  &["统一社会信用代码", "USCC"]
);
validator!(
  co_nit,
  "co.nit",
  CountryCode::Co,
  EntityType::Any,
  "Número de Identificación Tributaria",
  "Número de Identificación Tributaria",
  "NIT",
  r"\d{9,10}-?\d",
  "https://es.wikipedia.org/wiki/N%C3%BAmero_de_identificaci%C3%B3n_tributaria",
  &[8, 9, 10, 11, 12, 13, 14, 15, 16],
  &["2131234321", "8001234565"],
  &["NIT", "Número de Identificación Tributaria"]
);
validator!(
  cr_cpf,
  "cr.cpf",
  CountryCode::Cr,
  EntityType::Person,
  "Costa Rican Physical Person ID",
  "Cédula de Persona Física",
  "CPF",
  r"\d{9,12}",
  "https://www.tse.go.cr/",
  &[10],
  &["0304550175", "0109130259"],
  &["CPF", "cédula de persona física"]
);
validator!(
  cu_ni,
  "cu.ni",
  CountryCode::Cu,
  EntityType::Person,
  "Cuban Identity Card Number",
  "Número de Identidad",
  "NI",
  r"\d{11}",
  "https://www.ecured.cu/Carnet_de_Identidad",
  &[11],
  &["91021027775", "72062506561"],
  &["NI", "número de identidad", "carnet de identidad"]
);
validator!(
  cz_ico,
  "cz.ico",
  CountryCode::Cz,
  EntityType::Company,
  "Czech Company ID",
  "Identifikační číslo osoby",
  "IČO",
  r"\d{8}",
  "https://www.czso.cz/",
  &[8],
  &["25123891", "27074358"],
  &["IČO", "IČ", "identifikační číslo"]
);
validator!(
  de_handelsreg,
  "de.handelsreg",
  CountryCode::De,
  EntityType::Company,
  "German Company Register Number",
  "Handelsregisternummer",
  "HReg",
  r"(?:HRA|HRB|GnR|PR|VR)\s*\d{1,7}",
  "https://de.wikipedia.org/wiki/Handelsregister_(Deutschland)",
  &[],
  &["HRB 12345"],
  &["Handelsregisternummer", "Handelsregister", "HRB", "HRA"]
);
validator!(
  dk_cvr,
  "dk.cvr",
  CountryCode::Dk,
  EntityType::Company,
  "Danish Business Register Number",
  "CVR-nummer",
  "CVR",
  r"\d{8}",
  "https://erhvervsstyrelsen.dk/",
  &[],
  &["13585628"],
  &["CVR-nummer", "CVR"]
);
validator!(
  do_rnc,
  "do.rnc",
  CountryCode::Do,
  EntityType::Any,
  "Dominican Republic Tax ID",
  "Registro Nacional del Contribuyente",
  "RNC",
  r"\d{9}",
  "https://dgii.gov.do/",
  &[9, 11],
  &["131098193", "00113918205"],
  &["RNC", "Registro Nacional del Contribuyente"]
);
validator!(
  ec_ruc,
  "ec.ruc",
  CountryCode::Ec,
  EntityType::Any,
  "Registro Único de Contribuyentes",
  "Registro Único de Contribuyentes",
  "RUC",
  r"\d{13}",
  "https://www.sri.gob.ec/",
  &[13],
  &["1792060346001", "1790011674001"],
  &["RUC", "Registro Único de Contribuyentes"]
);
validator!(
  ee_registrikood,
  "ee.registrikood",
  CountryCode::Ee,
  EntityType::Company,
  "Estonian Company Registration Code",
  "Registrikood",
  "Registrikood",
  r"\d{8}",
  "https://www.rik.ee/",
  &[],
  &["12345678"],
  &["registrikood"]
);
validator!(
  eg_tn,
  "eg.tn",
  CountryCode::Eg,
  EntityType::Any,
  "Egyptian Tax Registration Number",
  "الرقم الضريبي",
  "TN",
  r"\d{9}",
  "https://www.eta.gov.eg/",
  &[9],
  &["100531385", "331105268"],
  &["الرقم الضريبي", "tax number"]
);
global_validator!(
  eu_vat,
  "eu.vat",
  EntityType::Company,
  "EU VAT Number",
  "EU VAT Number",
  "EU VAT",
  r"[A-Z]{2}\d{8,12}",
  "https://ec.europa.eu/taxation_customs/vies/",
  &[],
  &["ATU13585627", "DE136695976"],
  &["EU VAT", "VAT identification number"]
);
validator!(
  fr_nif,
  "fr.nif",
  CountryCode::Fr,
  EntityType::Person,
  "French Tax ID",
  "Numéro d'Identification Fiscale",
  "NIF",
  r"\d{13}",
  "https://www.impots.gouv.fr/",
  &[],
  &["3023217600053"],
  &["numéro fiscal", "NIF", "numéro d'identification fiscale"]
);
validator!(
  gb_sedol,
  "gb.sedol",
  CountryCode::Gb,
  EntityType::Any,
  "Stock Exchange Daily Official List number",
  "Stock Exchange Daily Official List number",
  "SEDOL",
  r"[B-DF-HJ-NP-TV-Z0-9]{6}\d",
  "https://en.wikipedia.org/wiki/SEDOL",
  &[7],
  &["B15KXQ8"],
  &["SEDOL", "Stock Exchange Daily Official List"]
);
validator!(
  gb_utr,
  "gb.utr",
  CountryCode::Gb,
  EntityType::Any,
  "UK Unique Taxpayer Reference",
  "Unique Taxpayer Reference",
  "UTR",
  r"\d{10}",
  "https://www.gov.uk/find-utr-number",
  &[],
  &["1955839661"],
  &["Unique Taxpayer Reference", "UTR"]
);
validator!(
  ge_pin,
  "ge.pin",
  CountryCode::Ge,
  EntityType::Any,
  "Georgian Personal ID",
  "პირადი ნომერი",
  "PIN",
  r"\d{11}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Georgia-TIN.pdf",
  &[9, 11],
  &["010043120", "01024030303"],
  &["პირადი ნომერი", "PIN"]
);
validator!(
  gh_tin,
  "gh.tin",
  CountryCode::Gh,
  EntityType::Any,
  "Ghanaian Tax Identification Number",
  "Tax Identification Number",
  "TIN",
  r"[A-Z]\d{9,10}",
  "https://gra.gov.gh/",
  &[11],
  &["C0000803561"],
  &["TIN", "Tax Identification Number"]
);
validator!(
  gr_amka,
  "gr.amka",
  CountryCode::Gr,
  EntityType::Person,
  "Greek Social Security Number",
  "Αριθμός Μητρώου Κοινωνικής Ασφάλισης",
  "ΑΜΚΑ",
  r"\d{11}",
  "https://www.amka.gr/",
  &[],
  &["01013099997"],
  &["ΑΜΚΑ", "Αριθμός Μητρώου Κοινωνικής Ασφάλισης", "AMKA"]
);
validator!(
  gt_nit,
  "gt.nit",
  CountryCode::Gt,
  EntityType::Any,
  "Tax Identification Number",
  "Número de Identificación Tributaria",
  "NIT",
  r"\d{7,8}-?\d",
  "https://portal.sat.gob.gt/portal/",
  &[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  &["576937K", "39525503", "71080"],
  &["NIT"]
);
validator!(
  hk_hkid,
  "hk.hkid",
  CountryCode::Hk,
  EntityType::Person,
  "Hong Kong Identity Card Number",
  "Hong Kong Identity Card Number",
  "HKID",
  r"[A-Z]{1,2}\d{6}[\dA]",
  "https://en.wikipedia.org/wiki/Hong_Kong_identity_card",
  &[8, 9],
  &["G123456A", "AB9876543"],
  &["HKID", "香港身份證"]
);
validator!(
  id_npwp,
  "id.npwp",
  CountryCode::Id,
  EntityType::Any,
  "Indonesian Taxpayer Identification Number",
  "Nomor Pokok Wajib Pajak",
  "NPWP",
  r"\d{2}\.?\d{3}\.?\d{3}\.?\d-?\d{3}\.?\d{3}",
  "https://en.wikipedia.org/wiki/Tax_identification_number#Indonesia",
  &[15, 16],
  &["013000666091000", "016090524017000"],
  &["NPWP", "Nomor Pokok Wajib Pajak"]
);
validator!(
  il_idnr,
  "il.idnr",
  CountryCode::Il,
  EntityType::Person,
  "Israeli Identity Number",
  "מספר זהות",
  "ת.ז.",
  r"\d{9}",
  "https://en.wikipedia.org/wiki/Israeli_identity_card",
  &[9],
  &["039337423", "000000018"],
  &["תעודת זהות", "Teudat Zehut", "ID number"]
);
validator!(
  in_aadhaar,
  "in.aadhaar",
  CountryCode::In,
  EntityType::Person,
  "Indian Unique Identity Number",
  "Aadhaar",
  "Aadhaar",
  r"\d{4}\s?\d{4}\s?\d{4}",
  "https://uidai.gov.in/",
  &[12],
  &["234123412346", "295274982189"],
  &["Aadhaar", "आधार"]
);
validator!(
  in_gstin,
  "in.gstin",
  CountryCode::In,
  EntityType::Company,
  "Indian Goods and Services Tax ID",
  "Goods and Services Tax Identification Number",
  "GSTIN",
  r"\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d][Z][A-Z\d]",
  "https://en.wikipedia.org/wiki/Goods_and_Services_Tax_Identification_Number",
  &[15],
  &["27AAPFU0939F1ZV", "29AAGCB7383J1Z4"],
  &["GSTIN", "GST number"]
);
validator!(
  in_pan,
  "in.pan",
  CountryCode::In,
  EntityType::Any,
  "Indian Permanent Account Number",
  "Permanent Account Number",
  "PAN",
  r"[A-Z]{5}\d{4}[A-Z]",
  "https://en.wikipedia.org/wiki/Permanent_account_number",
  &[10],
  &["ABCPP1234C", "AAACR5055K"],
  &["PAN", "Permanent Account Number"]
);
validator!(
  iq_nid,
  "iq.nid",
  CountryCode::Iq,
  EntityType::Person,
  "Iraqi National ID",
  "البطاقة الوطنية الموحدة",
  "NID",
  r"\d{12}",
  "https://mofa.gov.iq/the-civil-status-id/",
  &[12],
  &["012345678901"],
  &["NID", "البطاقة الوطنية الموحدة"]
);
validator!(
  ir_nid,
  "ir.nid",
  CountryCode::Ir,
  EntityType::Person,
  "Iranian National ID",
  "کد ملی",
  "NID",
  r"\d{10}",
  "https://www.sabteahval.ir/",
  &[10],
  &["0932833810"],
  &["NID", "کد ملی", "national code"]
);
validator!(
  is_kennitala,
  "is.kennitala",
  CountryCode::Is,
  EntityType::Any,
  "Icelandic ID Number",
  "Kennitala",
  "kt.",
  r"\d{6}-?\d{4}",
  "https://www.skra.is/",
  &[],
  &["4504013150", "1201743399"],
  &["kennitala", "kt."]
);
validator!(
  is_vsk,
  "is.vsk",
  CountryCode::Is,
  EntityType::Company,
  "Icelandic VAT Number",
  "Virðisaukaskattur",
  "VSK",
  r"IS\d{5,6}",
  "https://www.rsk.is/",
  &[],
  &["00621", "123456"],
  &["VSK-númer", "virðisaukaskattur"]
);
validator!(
  jp_cn,
  "jp.cn",
  CountryCode::Jp,
  EntityType::Company,
  "Japanese Corporate Number",
  "法人番号",
  "CN",
  r"\d{13}",
  "https://en.wikipedia.org/wiki/Corporate_Number_(Japan)",
  &[13],
  &["5835678256246", "2021001052596"],
  &["法人番号", "Corporate Number"]
);
validator!(
  jp_mynumber,
  "jp.mynumber",
  CountryCode::Jp,
  EntityType::Person,
  "Japanese Individual Number",
  "マイナンバー",
  "My Number",
  r"\d{4}[\s-]?\d{4}[\s-]?\d{4}",
  "https://en.wikipedia.org/wiki/Individual_Number",
  &[12],
  &["123456789018", "000000000019"],
  &["My Number", "マイナンバー", "個人番号"]
);
validator!(
  kr_brn,
  "kr.brn",
  CountryCode::Kr,
  EntityType::Company,
  "Korean Business Registration Number",
  "사업자등록번호",
  "BRN",
  r"\d{3}-?\d{2}-?\d{5}",
  "https://en.wikipedia.org/wiki/Business_registration_number_(South_Korea)",
  &[10],
  &["1168200131", "2208162517"],
  &["사업자등록번호", "BRN"]
);
validator!(
  kr_rrn,
  "kr.rrn",
  CountryCode::Kr,
  EntityType::Person,
  "Korean Resident Registration Number",
  "주민등록번호",
  "RRN",
  r"\d{6}[\s-]?\d{7}",
  "https://en.wikipedia.org/wiki/Resident_registration_number",
  &[13],
  &["9710139019902", "9501011000109"],
  &["RRN", "주민등록번호", "Resident Registration Number"]
);
validator!(
  kw_civil,
  "kw.civil",
  CountryCode::Kw,
  EntityType::Person,
  "Civil Number",
  "الرقم المدني",
  "Civil ID",
  r"\d{12}",
  "https://kuwaitsexpat.com/kuwait-civil-id-format/",
  &[12],
  &["289011200032", "305031512348"],
  &["Civil ID", "الرقم المدني"]
);
validator!(
  kz_iin,
  "kz.iin",
  CountryCode::Kz,
  EntityType::Person,
  "Kazakhstan Individual ID",
  "Жеке сәйкестендіру нөмірі",
  "IIN",
  r"\d{12}",
  "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Kazakhstan-TIN.pdf",
  &[12],
  &["880515300120", "950101400012"],
  &["ИИН", "IIN", "индивидуальный идентификационный номер"]
);
validator!(
  li_peid,
  "li.peid",
  CountryCode::Li,
  EntityType::Any,
  "Liechtenstein Person Identification Number",
  "Personenidentifikationsnummer",
  "PEID",
  r"\d{6}",
  "https://www.oera.li/",
  &[4, 5, 6, 7, 8, 9, 10, 11, 12],
  &["1234567"],
  &["PEID", "Personenidentifikation"]
);
validator!(
  lk_nic,
  "lk.nic",
  CountryCode::Lk,
  EntityType::Person,
  "National Identity Card",
  "ජාතික හැඳුනුම්පත",
  "NIC",
  r"\d{9}[VXvx]|\d{12}",
  "https://en.wikipedia.org/wiki/National_identification_number#Sri_Lanka",
  &[10, 12],
  &["197819202757", "862348753V"],
  &["NIC", "ජාතික හැඳුනුම්පත"]
);
validator!(
  ma_ice,
  "ma.ice",
  CountryCode::Ma,
  EntityType::Company,
  "Moroccan Company Identification Number",
  "Identifiant Commun de l'Entreprise",
  "ICE",
  r"\d{15}",
  "https://www.ice.gov.ma/",
  &[15],
  &["001561191000066", "002136093000040"],
  &["ICE", "Identifiant Commun de l'Entreprise"]
);
validator!(
  mc_tva,
  "mc.tva",
  CountryCode::Mc,
  EntityType::Company,
  "Monacan VAT Number",
  "Numéro de TVA",
  "TVA",
  r"FR\d{11}",
  "https://www.economie.gouv.fr/",
  &[],
  &["FR53000004605"],
  &["numéro de TVA", "TVA"]
);
validator!(
  md_idno,
  "md.idno",
  CountryCode::Md,
  EntityType::Company,
  "Moldavian Company Identification Number",
  "IDNO",
  "IDNO",
  r"\d{13}",
  "https://www.idno.md/",
  &[13],
  &["1008600038413"],
  &["IDNO", "cod de identificare"]
);
validator!(
  me_pib,
  "me.pib",
  CountryCode::Me,
  EntityType::Any,
  "Montenegrin Tax ID",
  "Poreski identifikacioni broj",
  "PIB",
  r"\d{8}",
  "https://www.tax.gov.me/",
  &[8],
  &["02655284"],
  &["PIB"]
);
validator!(
  mk_edb,
  "mk.edb",
  CountryCode::Mk,
  EntityType::Any,
  "North Macedonian Tax ID",
  "Edinstven danocen broj",
  "EDB",
  r"MK\d{13}",
  "https://www.ujp.gov.mk/",
  &[13],
  &["4002012527974"],
  &["ЕДБ", "единствен даночен број", "EDB"]
);
validator!(
  mu_brn,
  "mu.brn",
  CountryCode::Mu,
  EntityType::Any,
  "Mauritius Business Registration Number",
  "Business Registration Number",
  "BRN",
  r"[A-Z]\d{8}",
  "https://companies.govmu.org/",
  &[8, 9],
  &["C07015330", "C16135302"],
  &["BRN", "Business Registration Number"]
);
validator!(
  mx_clabe,
  "mx.clabe",
  CountryCode::Mx,
  EntityType::Any,
  "Mexican Bank Account",
  "Clave Bancaria Estandarizada",
  "CLABE",
  r"\d{18}",
  "https://en.wikipedia.org/wiki/CLABE",
  &[18],
  &["032180000118359719"],
  &["CLABE", "Clave Bancaria Estandarizada"]
);
validator!(
  mx_curp,
  "mx.curp",
  CountryCode::Mx,
  EntityType::Person,
  "Mexican Personal ID",
  "Clave Única de Registro de Población",
  "CURP",
  r"[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d",
  "https://en.wikipedia.org/wiki/CURP",
  &[18],
  &["BOXW310820HNERXN09"],
  &["CURP", "Clave Única de Registro de Población"]
);
validator!(
  mx_rfc,
  "mx.rfc",
  CountryCode::Mx,
  EntityType::Any,
  "Mexican Tax ID",
  "Registro Federal de Contribuyentes",
  "RFC",
  r"[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}",
  "https://en.wikipedia.org/wiki/Tax_Identification_Number_(Mexico)",
  &[12, 13],
  &["GODE561231GR8", "MAB9307148T4"],
  &["RFC", "Registro Federal de Contribuyentes"]
);
validator!(
  my_nric,
  "my.nric",
  CountryCode::My,
  EntityType::Person,
  "Malaysian National Registration Identity Card Number",
  "Nombor Kad Pengenalan",
  "NRIC",
  r"\d{6}-?\d{2}-?\d{4}",
  "https://en.wikipedia.org/wiki/Malaysian_identity_card",
  &[12],
  &["770305021234", "880715141234"],
  &["NRIC", "MyKad", "kad pengenalan"]
);

pub static VALIDATORS: &[&Validator] = &[
  &ad_nrt::VALIDATOR,
  &ae_eid::VALIDATOR,
  &ai_tin::VALIDATOR,
  &al_nipt::VALIDATOR,
  &am_tin::VALIDATOR,
  &ar_cbu::VALIDATOR,
  &ar_cuit::VALIDATOR,
  &ar_dni::VALIDATOR,
  &at_vnr::VALIDATOR,
  &au_tfn::VALIDATOR,
  &az_voen::VALIDATOR,
  &ba_jmbg::VALIDATOR,
  &bd_nid::VALIDATOR,
  &be_bis::VALIDATOR,
  &bg_egn::VALIDATOR,
  &bg_pnf::VALIDATOR,
  &bh_cpr::VALIDATOR,
  &by_unp::VALIDATOR,
  &bz_tin::VALIDATOR,
  &ca_bn::VALIDATOR,
  &ca_sin::VALIDATOR,
  &ch_ssn::VALIDATOR,
  &ch_vat::VALIDATOR,
  &cl_rut::VALIDATOR,
  &cn_uscc::VALIDATOR,
  &co_nit::VALIDATOR,
  &cr_cpf::VALIDATOR,
  &cu_ni::VALIDATOR,
  &cz_ico::VALIDATOR,
  &de_handelsreg::VALIDATOR,
  &dk_cvr::VALIDATOR,
  &do_rnc::VALIDATOR,
  &ec_ruc::VALIDATOR,
  &ee_registrikood::VALIDATOR,
  &eg_tn::VALIDATOR,
  &eu_vat::VALIDATOR,
  &fr_nif::VALIDATOR,
  &gb_sedol::VALIDATOR,
  &gb_utr::VALIDATOR,
  &ge_pin::VALIDATOR,
  &gh_tin::VALIDATOR,
  &gr_amka::VALIDATOR,
  &gt_nit::VALIDATOR,
  &hk_hkid::VALIDATOR,
  &id_npwp::VALIDATOR,
  &il_idnr::VALIDATOR,
  &in_aadhaar::VALIDATOR,
  &in_gstin::VALIDATOR,
  &in_pan::VALIDATOR,
  &iq_nid::VALIDATOR,
  &ir_nid::VALIDATOR,
  &is_kennitala::VALIDATOR,
  &is_vsk::VALIDATOR,
  &jp_cn::VALIDATOR,
  &jp_mynumber::VALIDATOR,
  &kr_brn::VALIDATOR,
  &kr_rrn::VALIDATOR,
  &kw_civil::VALIDATOR,
  &kz_iin::VALIDATOR,
  &li_peid::VALIDATOR,
  &lk_nic::VALIDATOR,
  &ma_ice::VALIDATOR,
  &mc_tva::VALIDATOR,
  &md_idno::VALIDATOR,
  &me_pib::VALIDATOR,
  &mk_edb::VALIDATOR,
  &mu_brn::VALIDATOR,
  &mx_clabe::VALIDATOR,
  &mx_curp::VALIDATOR,
  &mx_rfc::VALIDATOR,
  &my_nric::VALIDATOR,
];

#[cfg(test)]
mod tests {
  use serde::Deserialize;

  use super::VALIDATORS;

  #[derive(Default, Deserialize)]
  #[serde(rename_all = "camelCase")]
  struct FixtureSet {
    fixtures: Vec<Fixture>,
  }

  #[derive(Deserialize)]
  struct Fixture {
    id: String,
    value: String,
    expected: bool,
    compact: String,
    format: String,
  }

  #[test]
  fn registry_slice_ids_match_assigned_catalog_set() {
    const EXPECTED: &[&str] = &[
      "ad.nrt",
      "ae.eid",
      "ai.tin",
      "al.nipt",
      "am.tin",
      "ar.cbu",
      "ar.cuit",
      "ar.dni",
      "at.vnr",
      "au.tfn",
      "az.voen",
      "ba.jmbg",
      "bd.nid",
      "be.bis",
      "bg.egn",
      "bg.pnf",
      "bh.cpr",
      "by.unp",
      "bz.tin",
      "ca.bn",
      "ca.sin",
      "ch.ssn",
      "ch.vat",
      "cl.rut",
      "cn.uscc",
      "co.nit",
      "cr.cpf",
      "cu.ni",
      "cz.ico",
      "de.handelsreg",
      "dk.cvr",
      "do.rnc",
      "ec.ruc",
      "ee.registrikood",
      "eg.tn",
      "eu.vat",
      "fr.nif",
      "gb.sedol",
      "gb.utr",
      "ge.pin",
      "gh.tin",
      "gr.amka",
      "gt.nit",
      "hk.hkid",
      "id.npwp",
      "il.idnr",
      "in.aadhaar",
      "in.gstin",
      "in.pan",
      "iq.nid",
      "ir.nid",
      "is.kennitala",
      "is.vsk",
      "jp.cn",
      "jp.mynumber",
      "kr.brn",
      "kr.rrn",
      "kw.civil",
      "kz.iin",
      "li.peid",
      "lk.nic",
      "ma.ice",
      "mc.tva",
      "md.idno",
      "me.pib",
      "mk.edb",
      "mu.brn",
      "mx.clabe",
      "mx.curp",
      "mx.rfc",
      "my.nric",
    ];
    let actual = VALIDATORS
      .iter()
      .map(|validator| validator.id())
      .collect::<Vec<_>>();
    assert_eq!(
      actual, EXPECTED,
      "AD-MY registry slice drifted from catalog"
    );
  }

  #[test]
  fn catalog_examples_and_generated_values_validate() {
    for validator in VALIDATORS {
      for example in validator.examples() {
        assert!(
          validator.validate(example).is_ok(),
          "{} rejected catalog example {example}",
          validator.id()
        );
      }
      let mut generated_values = std::collections::HashSet::new();
      for _ in 0..8 {
        let generated = validator.generate().unwrap_or_default();
        assert!(
          validator.validate(&generated).is_ok(),
          "{} generated invalid value {generated}",
          validator.id()
        );
        generated_values.insert(generated);
      }
      assert!(
        generated_values.len() > 1,
        "{} generator did not vary",
        validator.id()
      );
    }
  }

  #[test]
  fn committed_fixtures_match_slice_behavior() {
    let fixture_set = serde_json::from_str::<FixtureSet>(include_str!(
      "../../../../packages/stdnum/fixtures/parity.json"
    ))
    .unwrap_or_default();
    let mut checked = 0_usize;
    for fixture in fixture_set.fixtures {
      let Some(validator) = VALIDATORS
        .iter()
        .find(|validator| validator.id() == fixture.id)
      else {
        continue;
      };
      checked = checked.saturating_add(1);
      let result = validator.validate(&fixture.value);
      assert_eq!(
        result.is_ok(),
        fixture.expected,
        "{} validation differed for {}: {result:?}",
        fixture.id,
        fixture.value
      );
      assert_eq!(
        validator.compact(&fixture.value),
        fixture.compact,
        "{} compact differed for {}",
        fixture.id,
        fixture.value
      );
      assert_eq!(
        validator.format(&fixture.value),
        fixture.format,
        "{} format differed for {}",
        fixture.id,
        fixture.value
      );
    }
    assert!(
      checked > VALIDATORS.len(),
      "slice fixtures were not exercised"
    );
  }

  #[test]
  fn mexican_rfc_counts_unicode_prefixes_as_characters() {
    let validator = VALIDATORS
      .iter()
      .find(|validator| validator.id() == "mx.rfc");
    assert!(
      validator
        .is_some_and(|validator| validator.validate("ORJÑ610528G5A").is_ok()),
      "RFC with Ñ prefix should retain TypeScript parity"
    );
  }
}

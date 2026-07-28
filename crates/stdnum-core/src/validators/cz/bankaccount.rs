//! Czech national bank account number.

use crate::types::{
  CanonicalValidation, CountryCode, EntityType, ValidationError,
  ValidationResult, Validator, ValidatorScope, ValidatorSpec,
};

const PART_WEIGHTS: &[u32; 10] = &[6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
const BANK_CODES: &[u16] =
  include!(concat!(env!("OUT_DIR"), "/cz_bank_codes.rs"));
const CANONICAL_LENGTH: usize = 22;

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "cz.bankaccount",
  name: "Czech Bank Account Number",
  local_name: "Číslo účtu v národním formátu",
  abbreviation: "Číslo účtu",
  aliases: &["číslo účtu", "bankovní účet", "bankovní spojení"],
  candidate_pattern: r"(?:\d{1,6}-)?\d{2,10}/\d{4}",
  scope: ValidatorScope::Country(CountryCode::Cz),
  entity_type: EntityType::Any,
  source_url: Some("https://www.cnb.cz/cs/platebni-styk/ucty-kody-bank/"),
  lengths: &[CANONICAL_LENGTH],
  examples: &["034278-0727558021/0100"],
  compact,
  format,
  validate,
  generate: None,
  parse: None,
})
.with_canonical_validator(validate_canonical);

#[derive(Clone, Copy)]
struct AccountParts<'value> {
  prefix: Option<&'value str>,
  root: &'value str,
  bank: &'value str,
}

#[must_use]
pub fn compact(value: &str) -> String {
  let value = value.trim();
  parse_parts(value)
    .map_or_else(|_| value.to_owned(), |parts| canonicalize(parts))
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let parts = parse_parts(value.trim())?;
  validate_parts(parts)?;
  Ok(canonicalize(parts))
}

/// Validate the exact output of [`compact`] without allocating.
#[must_use]
pub fn is_valid_canonical(value: &str) -> bool {
  validate_canonical(value) == CanonicalValidation::Valid
}

fn validate_canonical(value: &str) -> CanonicalValidation {
  let bytes = value.as_bytes();
  if bytes.len() != CANONICAL_LENGTH {
    return CanonicalValidation::NotCanonical;
  }
  if value.chars().next().is_some_and(char::is_whitespace)
    || value.chars().next_back().is_some_and(char::is_whitespace)
  {
    return CanonicalValidation::NotCanonical;
  }

  let mut prefix_sum = 0_u32;
  let mut root_sum = 0_u32;
  let mut root_nonzero_digits = 0_u8;
  let mut bank_code = 0_u16;

  for (index, byte) in bytes.iter().copied().enumerate() {
    if !byte.is_ascii() {
      return CanonicalValidation::NotCanonical;
    }
    match index {
      6 if byte == b'-' => {}
      17 if byte == b'/' => {}
      0..=5 | 7..=16 | 18..=21 if byte.is_ascii_digit() => {
        let digit = u32::from(byte.saturating_sub(b'0'));
        match index {
          0..=5 => {
            let Some(weight) =
              PART_WEIGHTS.get(index.saturating_add(4)).copied()
            else {
              return CanonicalValidation::Invalid(
                ValidationError::InvalidFormat(
                  "Czech bank account prefix position is invalid",
                ),
              );
            };
            prefix_sum =
              prefix_sum.saturating_add(digit.saturating_mul(weight));
          }
          7..=16 => {
            let Some(weight) =
              PART_WEIGHTS.get(index.saturating_sub(7)).copied()
            else {
              return CanonicalValidation::Invalid(
                ValidationError::InvalidFormat(
                  "Czech bank account root position is invalid",
                ),
              );
            };
            root_sum = root_sum.saturating_add(digit.saturating_mul(weight));
            root_nonzero_digits =
              root_nonzero_digits.saturating_add(u8::from(digit != 0));
          }
          18..=21 => {
            bank_code = bank_code
              .saturating_mul(10)
              .saturating_add(u16::from(byte.saturating_sub(b'0')));
          }
          _ => {}
        }
      }
      _ => {
        return CanonicalValidation::Invalid(ValidationError::InvalidFormat(
          "Czech bank account must use the canonical digit and separator positions",
        ));
      }
    }
  }

  if root_nonzero_digits < 2 {
    return CanonicalValidation::Invalid(ValidationError::InvalidComponent(
      "Czech basic account number must contain at least two non-zero digits",
    ));
  }
  if !prefix_sum.is_multiple_of(11) || !root_sum.is_multiple_of(11) {
    return CanonicalValidation::Invalid(ValidationError::InvalidChecksum(
      "Czech bank account part fails the modulo 11 check",
    ));
  }
  if !is_assigned_bank_code(bank_code) {
    return CanonicalValidation::Invalid(ValidationError::InvalidComponent(
      "Czech bank code is not assigned by the Czech National Bank",
    ));
  }
  CanonicalValidation::Valid
}

fn parse_parts(value: &str) -> Result<AccountParts<'_>, ValidationError> {
  let Some((account, bank)) = value.split_once('/') else {
    return Err(ValidationError::InvalidFormat(
      "Czech bank account must contain a bank code after '/'",
    ));
  };
  if bank.contains('/') {
    return Err(ValidationError::InvalidFormat(
      "Czech bank account must contain one '/' separator",
    ));
  }
  let (prefix, root) = match account.split_once('-') {
    Some((prefix, root)) if !root.contains('-') => (Some(prefix), root),
    Some(_) => {
      return Err(ValidationError::InvalidFormat(
        "Czech bank account must contain at most one '-' separator",
      ));
    }
    None => (None, account),
  };
  if prefix.is_some_and(str::is_empty)
    || prefix.is_some_and(|prefix| prefix.len() > 6)
    || !(2..=10).contains(&root.len())
    || bank.len() != 4
  {
    return Err(ValidationError::InvalidLength(
      "Czech bank account parts have invalid lengths",
    ));
  }
  if prefix.is_some_and(|prefix| !is_ascii_digits(prefix))
    || !is_ascii_digits(root)
    || !is_ascii_digits(bank)
  {
    return Err(ValidationError::InvalidFormat(
      "Czech bank account must contain only ASCII digits",
    ));
  }
  Ok(AccountParts { prefix, root, bank })
}

fn validate_parts(parts: AccountParts<'_>) -> Result<(), ValidationError> {
  if parts.root.bytes().filter(|digit| *digit != b'0').count() < 2 {
    return Err(ValidationError::InvalidComponent(
      "Czech basic account number must contain at least two non-zero digits",
    ));
  }
  if parts
    .prefix
    .is_some_and(|prefix| !has_valid_checksum(prefix))
    || !has_valid_checksum(parts.root)
  {
    return Err(ValidationError::InvalidChecksum(
      "Czech bank account part fails the modulo 11 check",
    ));
  }
  let bank_code = parts.bank.bytes().fold(0_u16, |code, digit| {
    code
      .saturating_mul(10)
      .saturating_add(u16::from(digit.saturating_sub(b'0')))
  });
  if !is_assigned_bank_code(bank_code) {
    return Err(ValidationError::InvalidComponent(
      "Czech bank code is not assigned by the Czech National Bank",
    ));
  }
  Ok(())
}

fn has_valid_checksum(part: &str) -> bool {
  let offset = PART_WEIGHTS.len().saturating_sub(part.len());
  let Some(weights) = PART_WEIGHTS.get(offset..) else {
    return false;
  };
  part
    .bytes()
    .zip(weights.iter().copied())
    .fold(0_u32, |sum, (digit, weight)| {
      sum.saturating_add(
        u32::from(digit.saturating_sub(b'0')).saturating_mul(weight),
      )
    })
    .is_multiple_of(11)
}

/// Return whether a four-digit code is assigned by the Czech National Bank.
///
/// This is the allocation-free catalog boundary for callers that already parse
/// a bank account and do not need normalized account output or diagnostics.
#[must_use]
pub fn is_assigned_bank_code(bank: u16) -> bool {
  BANK_CODES.binary_search(&bank).is_ok()
}

fn canonicalize(parts: AccountParts<'_>) -> String {
  let prefix = parts.prefix.unwrap_or("");
  let mut canonical = String::with_capacity(CANONICAL_LENGTH);
  canonical.extend(std::iter::repeat_n(
    '0',
    6_usize.saturating_sub(prefix.len()),
  ));
  canonical.push_str(prefix);
  canonical.push('-');
  canonical.extend(std::iter::repeat_n(
    '0',
    10_usize.saturating_sub(parts.root.len()),
  ));
  canonical.push_str(parts.root);
  canonical.push('/');
  canonical.push_str(parts.bank);
  canonical
}

fn is_ascii_digits(value: &str) -> bool {
  !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit())
}

#[cfg(test)]
mod tests {
  use proptest::prelude::*;

  use super::{
    BANK_CODES, CanonicalValidation, PART_WEIGHTS, ValidationError, compact,
    is_valid_canonical, validate, validate_canonical,
  };

  const BANK_CODE_COUNT: usize = 47;

  #[test]
  fn accepts_statutory_shapes_and_canonicalizes_padding() {
    for (value, expected) in [
      ("34278-0727558021/0100", "034278-0727558021/0100"),
      ("19-2000145399/0800", "000019-2000145399/0800"),
      ("2000145399/0800", "000000-2000145399/0800"),
    ] {
      assert_eq!(validate(value).as_deref(), Ok(expected), "{value}");
      assert_eq!(compact(value), expected, "{value}");
      assert!(is_valid_canonical(expected), "{expected}");
    }
  }

  #[test]
  fn canonical_path_falls_back_for_trimmed_twenty_two_byte_inputs() {
    let canonical = "034278-0727558021/0100";
    for value in ["34278-0727558021/0100 ", "\t34278-0727558021/0100"] {
      assert_eq!(validate(value).as_deref(), Ok(canonical), "{value:?}");
      assert_eq!(
        validate_canonical(value),
        CanonicalValidation::NotCanonical,
        "{value:?}"
      );
    }
  }

  #[test]
  fn rejects_invalid_components_with_stable_error_kinds() {
    for zero_root in ["00/0100", "000000-0000000000/0100"] {
      assert!(matches!(
        validate(zero_root),
        Err(ValidationError::InvalidComponent(_))
      ));
      assert!(!is_valid_canonical(zero_root));
    }
    assert!(matches!(
      validate("4278-727558021/0100"),
      Err(ValidationError::InvalidChecksum(_))
    ));
    assert!(matches!(
      validate("34278-727558021/0500"),
      Err(ValidationError::InvalidComponent(_))
    ));
    for malformed in [
      "-2000145399/0800",
      "19--2000145399/0800",
      "19-2000145399//0800",
      "19- 2000145399/0800",
      "19-2000145399 /0800",
    ] {
      assert!(validate(malformed).is_err(), "{malformed}");
    }
  }

  #[test]
  fn bank_code_data_is_sorted_unique_and_exhaustive_for_membership() {
    assert_eq!(BANK_CODES.len(), BANK_CODE_COUNT, "bank code count changed");
    assert!(
      BANK_CODES.windows(2).all(|pair| {
        pair
          .first()
          .zip(pair.last())
          .is_some_and(|(left, right)| left < right)
      }),
      "bank codes must remain sorted and unique"
    );
    for code in 0_u16..=9_999 {
      let expected = BANK_CODES.contains(&code);
      assert_eq!(
        validate(&format!("000019-2000145399/{code:04}")).is_ok(),
        expected,
        "{code:04}"
      );
    }
  }

  fn component_with_check_digit(base: &[u8]) -> Option<String> {
    let length = base.len().saturating_add(1);
    let offset = PART_WEIGHTS.len().checked_sub(length)?;
    let weights = PART_WEIGHTS.get(offset..)?;
    let sum = base.iter().zip(weights.iter().copied()).fold(
      0_u32,
      |sum, (digit, weight)| {
        sum.saturating_add(u32::from(*digit).saturating_mul(weight))
      },
    );
    let check = 11_u32.saturating_sub(sum.rem_euclid(11)).rem_euclid(11);
    let check = u8::try_from(check).ok()?;
    if check > 9 {
      return None;
    }
    let mut component = String::with_capacity(length);
    component.extend(
      base
        .iter()
        .map(|digit| char::from(b'0'.saturating_add(*digit))),
    );
    component.push(char::from(b'0'.saturating_add(check)));
    Some(component)
  }

  proptest! {
    #[test]
    fn checksum_components_round_trip_and_detect_every_single_digit_error(
      prefix_base in prop::collection::vec(0_u8..10, 5),
      root_base in prop::collection::vec(0_u8..10, 9),
      bank_index in 0_usize..BANK_CODE_COUNT,
    ) {
      let Some(prefix) = component_with_check_digit(&prefix_base) else {
        return Ok(());
      };
      let Some(root) = component_with_check_digit(&root_base) else {
        return Ok(());
      };
      prop_assume!(root.bytes().filter(|digit| *digit != b'0').count() >= 2);
      let Some(bank) = BANK_CODES.get(bank_index) else {
        return Ok(());
      };
      let candidate = format!("{prefix}-{root}/{bank:04}");
      prop_assert!(validate(&candidate).is_ok(), "{candidate}");
      prop_assert!(is_valid_canonical(&candidate), "{candidate}");

      let mut digit_offsets = (0_usize..6).collect::<Vec<_>>();
      digit_offsets.extend(7_usize..17);
      for offset in digit_offsets {
        let mut mutation = candidate.as_bytes().to_vec();
        let Some(digit) = mutation.get_mut(offset) else {
          return Ok(());
        };
        *digit = if *digit == b'9' {
          b'0'
        } else {
          digit.saturating_add(1)
        };
        let Ok(mutation) = String::from_utf8(mutation) else {
          return Ok(());
        };
        prop_assert!(validate(&mutation).is_err(), "{mutation}");
        prop_assert!(!is_valid_canonical(&mutation), "{mutation}");
      }
    }

    #[test]
    fn roots_with_fewer_than_two_nonzero_digits_are_invalid_components(
      include_nonzero in any::<bool>(),
      nonzero_position in 0_usize..10,
      nonzero_digit in 1_u8..=9,
    ) {
      let mut root = vec![b'0'; 10];
      if include_nonzero {
        let Some(digit) = root.get_mut(nonzero_position) else {
          return Ok(());
        };
        *digit = b'0'.saturating_add(nonzero_digit);
      }
      let Ok(root) = String::from_utf8(root) else {
        return Ok(());
      };
      let candidate = format!("{root}/0100");
      let result = validate(&candidate);
      prop_assert!(matches!(
        result,
        Err(ValidationError::InvalidComponent(_))
      ), "{candidate}");
    }
  }
}

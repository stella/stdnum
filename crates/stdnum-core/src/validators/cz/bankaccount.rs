//! Czech national bank account number.

use crate::types::{
  CanonicalValidation, CountryCode, EntityType, ValidationError,
  ValidationResult, Validator, ValidatorScope, ValidatorSpec,
};

const PART_WEIGHTS: &[u32; 10] = &[6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
const BANK_CODES: &str = include_str!("bank_codes.txt");
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
  if value.trim() != value {
    return CanonicalValidation::NotCanonical;
  }
  let parts = match parse_parts(value) {
    Ok(parts) => parts,
    Err(error) => return CanonicalValidation::Invalid(error),
  };
  if parts.prefix.map(str::len) != Some(6) || parts.root.len() != 10 {
    return CanonicalValidation::NotCanonical;
  }
  match validate_parts(parts) {
    Ok(()) => CanonicalValidation::Valid,
    Err(error) => CanonicalValidation::Invalid(error),
  }
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
  if parts
    .prefix
    .is_some_and(|prefix| !has_valid_checksum(prefix))
    || !has_valid_checksum(parts.root)
  {
    return Err(ValidationError::InvalidChecksum(
      "Czech bank account part fails the modulo 11 check",
    ));
  }
  if !is_assigned_bank_code(parts.bank) {
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

fn is_assigned_bank_code(bank: &str) -> bool {
  BANK_CODES.lines().any(|code| code == bank)
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
    BANK_CODES, PART_WEIGHTS, ValidationError, compact, is_valid_canonical,
    validate,
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
  fn rejects_invalid_components_with_stable_error_kinds() {
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
    let codes = BANK_CODES
      .lines()
      .filter(|line| !line.starts_with('#'))
      .collect::<Vec<_>>();
    assert_eq!(codes.len(), BANK_CODE_COUNT, "bank code count changed");
    assert!(
      codes.windows(2).all(|pair| {
        pair
          .first()
          .zip(pair.last())
          .is_some_and(|(left, right)| left < right)
      }),
      "bank codes must remain sorted and unique"
    );
    for code in 0_u16..=9_999 {
      let code = format!("{code:04}");
      let expected = codes.contains(&code.as_str());
      assert_eq!(
        validate(&format!("000019-2000145399/{code}")).is_ok(),
        expected,
        "{code}"
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
      let Some(bank) = BANK_CODES
        .lines()
        .filter(|line| !line.starts_with('#'))
        .nth(bank_index)
      else {
        return Ok(());
      };
      let candidate = format!("{prefix}-{root}/{bank}");
      prop_assert!(validate(&candidate).is_ok(), "{candidate}");

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
      }
    }
  }
}

use crate::{ValidationError, ValidationResult, compact_without, random_below};

pub(super) const fn invalid_length() -> ValidationError {
  ValidationError::InvalidLength("identifier has an invalid length")
}

pub(super) const fn invalid_format() -> ValidationError {
  ValidationError::InvalidFormat("identifier has an invalid format")
}

pub(super) const fn invalid_component() -> ValidationError {
  ValidationError::InvalidComponent("identifier contains an invalid component")
}

pub(super) const fn invalid_checksum() -> ValidationError {
  ValidationError::InvalidChecksum("identifier checksum mismatch")
}

pub(super) fn compact(value: &str) -> String {
  compact_without(value.trim(), &[' ', '-', '.', '/', '(', ')'])
}

pub(super) fn is_digits(value: &str) -> bool {
  !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit())
}

pub(super) fn require_digits(
  value: &str,
  length: usize,
) -> Result<(), ValidationError> {
  if value.len() != length {
    return Err(invalid_length());
  }
  if !is_digits(value) {
    return Err(invalid_format());
  }
  Ok(())
}

pub(super) fn digit(value: &str, index: usize) -> u32 {
  value
    .as_bytes()
    .get(index)
    .map_or(0, |byte| u32::from(byte.saturating_sub(b'0')))
}

pub(super) fn weighted_sum(value: &str, weights: &[u32]) -> u32 {
  value.bytes().zip(weights.iter().copied()).fold(
    0_u32,
    |sum, (byte, weight)| {
      sum.saturating_add(
        u32::from(byte.saturating_sub(b'0')).saturating_mul(weight),
      )
    },
  )
}

pub(super) fn groups(
  value: &str,
  spans: &[(usize, usize)],
  separator: &str,
) -> String {
  spans
    .iter()
    .map(|(start, end)| value.get(*start..*end).unwrap_or(""))
    .collect::<Vec<_>>()
    .join(separator)
}

pub(super) fn generate_from_examples(
  examples: &[&str],
  compact: fn(&str) -> String,
  validate: fn(&str) -> ValidationResult,
) -> String {
  let example = examples
    .get(random_below(examples.len()))
    .copied()
    .unwrap_or("");
  let compact = compact(example);
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
    if candidate != compact && validate(&candidate).is_ok() {
      return candidate;
    }
  }
  compact
}

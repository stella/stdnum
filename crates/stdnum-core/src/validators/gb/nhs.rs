//! UK NHS Number.

pub use crate::validators::legacy_specs::gb_nhs::*;

/// Calculate the NHS modulus-11 check digit for a ten-digit candidate.
#[must_use]
pub fn calc_check_digit(value: &str) -> Option<u32> {
  if value.len() != 10 || !value.bytes().all(|byte| byte.is_ascii_digit()) {
    return None;
  }
  let total = value.bytes().take(9).enumerate().try_fold(
    0_u32,
    |sum, (index, byte)| {
      let digit = u32::from(byte.checked_sub(b'0')?);
      let index = u32::try_from(index).ok()?;
      sum.checked_add(digit.checked_mul(10_u32.checked_sub(index)?)?)
    },
  )?;
  match 11_u32.checked_sub(total.rem_euclid(11))? {
    10 => None,
    11 => Some(0),
    check => Some(check),
  }
}

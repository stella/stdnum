//! Spanish VAT Number.

pub use crate::validators::legacy_specs::es_vat::*;

/// Calculate the numeric CIF check value for a seven-digit payload.
#[must_use]
pub fn cif_checksum(digits: &str) -> Option<u32> {
  if digits.len() != 7 || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
    return None;
  }
  let mut even = 0_u32;
  let mut odd = 0_u32;
  for (index, byte) in digits.bytes().enumerate() {
    let digit = u32::from(byte.checked_sub(b'0')?);
    if index.rem_euclid(2) == 0 {
      let doubled = digit.checked_mul(2)?;
      let digit_sum =
        doubled.div_euclid(10).checked_add(doubled.rem_euclid(10))?;
      odd = odd.checked_add(digit_sum)?;
    } else {
      even = even.checked_add(digit)?;
    }
  }
  let sum = even.checked_add(odd)?;
  Some(10_u32.checked_sub(sum.rem_euclid(10))?.rem_euclid(10))
}

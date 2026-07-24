//! Estonian Personal ID.

pub use crate::validators::legacy_specs::ee_ik::*;

const WEIGHTS_1: [u32; 10] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
const WEIGHTS_2: [u32; 10] = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

/// Compute the two-pass check digit shared by Estonian and Lithuanian personal IDs.
#[must_use]
pub fn two_pass_check(digits: &str) -> Option<u32> {
  if digits.len() != 10 || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
    return None;
  }
  let weighted = |weights: &[u32; 10]| {
    digits
      .bytes()
      .zip(weights)
      .try_fold(0_u32, |sum, (byte, weight)| {
        let digit = u32::from(byte.checked_sub(b'0')?);
        sum.checked_add(digit.checked_mul(*weight)?)
      })
  };
  let first = weighted(&WEIGHTS_1)?.rem_euclid(11);
  if first != 10 {
    return Some(first);
  }
  let second = weighted(&WEIGHTS_2)?.rem_euclid(11);
  Some(if second == 10 { 0 } else { second })
}

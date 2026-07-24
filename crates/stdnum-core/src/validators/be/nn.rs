//! Belgian National Number.

pub use crate::validators::legacy_specs::be_nn::*;

/// Verify the Belgian mod-97 check pair and return the encoded century.
#[must_use]
pub fn checksum(value: &str) -> Option<i32> {
  let compact = compact(value);
  let first_nine = compact.get(..9)?.parse::<u64>().ok()?;
  let check = compact.get(9..11)?.parse::<u64>().ok()?;
  if 97_u64.checked_sub(first_nine.rem_euclid(97))? == check {
    return Some(1900);
  }

  let year = compact.get(..2)?.parse::<u64>().ok()?;
  let current_year = u64::from(crate::current_year());
  if year.checked_add(2000)? > current_year {
    return None;
  }
  let with_century = format!("2{first_nine:09}").parse::<u64>().ok()?;
  (97_u64.checked_sub(with_century.rem_euclid(97))? == check).then_some(2000)
}

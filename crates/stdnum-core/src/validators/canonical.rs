const AUSTRIAN_UID_LUHN_OFFSET: u32 = 6;
pub(super) const DE_STNR_PATTERNS: &[&str] = &[
  "FFBBBUUUUP",
  "28FF0BBBUUUUP",
  "FFFBBBUUUUP",
  "9FFF0BBBUUUUP",
  "11FF0BBBUUUUP",
  "0FFBBBUUUUP",
  "30FF0BBBUUUUP",
  "24FF0BBBUUUUP",
  "22FF0BBBUUUUP",
  "26FF0BBBUUUUP",
  "40FF0BBBUUUUP",
  "23FF0BBBUUUUP",
  "FFFBBBBUUUP",
  "5FFF0BBBBUUUP",
  "27FF0BBBUUUUP",
  "10FF0BBBUUUUP",
  "2FFBBBUUUUP",
  "32FF0BBBUUUUP",
  "1FFBBBUUUUP",
  "31FF0BBBUUUUP",
  "21FF0BBBUUUUP",
  "41FF0BBBUUUUP",
];
const FRENCH_TVA_ALPHABET: &[u8] = b"0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

fn digits<const LENGTH: usize>(value: &str) -> Option<&[u8; LENGTH]> {
  let bytes = <&[u8; LENGTH]>::try_from(value.as_bytes()).ok()?;
  bytes.iter().all(u8::is_ascii_digit).then_some(bytes)
}

fn digit(byte: u8) -> u32 {
  u32::from(byte.saturating_sub(b'0'))
}

fn number(bytes: &[u8]) -> Option<u64> {
  bytes.iter().try_fold(0_u64, |number, byte| {
    number
      .checked_mul(10)?
      .checked_add(u64::from(byte.saturating_sub(b'0')))
  })
}

fn weighted(bytes: &[u8], weights: &[u32]) -> u32 {
  bytes
    .iter()
    .zip(weights)
    .fold(0_u32, |sum, (byte, weight)| {
      sum.saturating_add(digit(*byte).saturating_mul(*weight))
    })
}

fn luhn(bytes: &[u8]) -> u32 {
  let mut sum = 0_u32;
  let mut double = false;
  for byte in bytes.iter().rev() {
    let mut value = digit(*byte);
    if double {
      value = value.saturating_mul(2);
      if value > 9 {
        value = value.saturating_sub(9);
      }
    }
    sum = sum.saturating_add(value);
    double = !double;
  }
  sum % 10
}

fn mod1110(bytes: &[u8]) -> Option<u32> {
  if bytes.is_empty() {
    return None;
  }
  let mut product = 10_u32;
  for byte in bytes {
    let mut sum = digit(*byte).saturating_add(product) % 10;
    if sum == 0 {
      sum = 10;
    }
    product = sum.saturating_mul(2) % 11;
  }
  Some(11_u32.saturating_sub(product) % 10)
}

const fn is_leap_year(year: u32) -> bool {
  year.is_multiple_of(4) && !year.is_multiple_of(100)
    || year.is_multiple_of(400)
}

const fn valid_date(year: u32, month: u32, day: u32) -> bool {
  let days = match month {
    1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
    4 | 6 | 9 | 11 => 30,
    2 if is_leap_year(year) => 29,
    2 => 28,
    _ => return false,
  };
  day > 0 && day <= days
}

fn decode_cz_month(raw_month: u32, year: u32, length: usize) -> Option<u32> {
  let offsets: &[u32] = if length == 10 && year >= 2004 {
    &[0, 50, 20, 70]
  } else {
    &[0, 50]
  };
  offsets.iter().find_map(|offset| {
    let month = raw_month.checked_sub(*offset)?;
    (1..=12).contains(&month).then_some(month)
  })
}

pub(super) fn at_tin(value: &str) -> bool {
  let Some(bytes) = digits::<9>(value) else {
    return false;
  };
  let Some((check, payload)) = bytes.split_last() else {
    return false;
  };
  let double = [0_u32, 2, 4, 6, 8, 1, 3, 5, 7, 9];
  let mut sum = 0_u32;
  for (position, byte) in payload.iter().enumerate() {
    let numeric = digit(*byte);
    let weighted_digit = if position.is_multiple_of(2) {
      numeric
    } else {
      let Ok(index) = usize::try_from(numeric) else {
        return false;
      };
      let Some(doubled) = double.get(index) else {
        return false;
      };
      *doubled
    };
    sum = sum.saturating_add(weighted_digit);
  }
  10_u32.saturating_sub(sum % 10) % 10 == digit(*check)
}

pub(super) fn at_uid(value: &str) -> bool {
  let Some(bytes) = value.get(1..).and_then(digits::<8>) else {
    return false;
  };
  if !value.starts_with('U') {
    return false;
  }
  let Some((check_digit, payload)) = bytes.split_last() else {
    return false;
  };
  let check = AUSTRIAN_UID_LUHN_OFFSET
    .saturating_add(10)
    .saturating_sub(luhn(payload))
    % 10;
  digit(*check_digit) == check
}

pub(super) fn be_vat(value: &str) -> bool {
  let Some(bytes) = digits::<10>(value) else {
    return false;
  };
  if !matches!(bytes.first(), Some(b'0' | b'1'))
    || bytes.iter().all(|byte| *byte == b'0')
  {
    return false;
  }
  let Some(front) = bytes.get(..8).and_then(number) else {
    return false;
  };
  let Some(check) = bytes.get(8..).and_then(number) else {
    return false;
  };
  front.saturating_add(check).is_multiple_of(97)
}

pub(super) fn cz_rc(value: &str) -> bool {
  if !matches!(value.len(), 9 | 10)
    || !value.bytes().all(|byte| byte.is_ascii_digit())
  {
    return false;
  }
  let bytes = value.as_bytes();
  let Some(yy) = bytes.get(..2).and_then(number) else {
    return false;
  };
  let Some(raw_month) = bytes.get(2..4).and_then(number) else {
    return false;
  };
  let Some(day) = bytes.get(4..6).and_then(number) else {
    return false;
  };
  let Ok(mut year) = u32::try_from(yy) else {
    return false;
  };
  year = year.saturating_add(1900);
  if value.len() == 9 {
    if year >= 1980 {
      year = year.saturating_sub(100);
    }
    if year > 1953 {
      return false;
    }
  } else if year < 1954 {
    year = year.saturating_add(100);
  }
  let Ok(raw_month) = u32::try_from(raw_month) else {
    return false;
  };
  let Some(month) = decode_cz_month(raw_month, year, value.len()) else {
    return false;
  };
  let Ok(day) = u32::try_from(day) else {
    return false;
  };
  if !valid_date(year, month, day) {
    return false;
  }
  if value.len() == 9 {
    return true;
  }
  let Some(front) = bytes.get(..9).and_then(number) else {
    return false;
  };
  bytes
    .last()
    .is_some_and(|check| front % 11 % 10 == u64::from(digit(*check)))
}

pub(super) fn cz_dic(value: &str) -> bool {
  if !(8..=10).contains(&value.len())
    || !value.bytes().all(|byte| byte.is_ascii_digit())
  {
    return false;
  }
  let bytes = value.as_bytes();
  let Some((check, payload)) = bytes.split_last() else {
    return false;
  };
  match value.len() {
    8 => {
      if payload.first() == Some(&b'9') {
        return false;
      }
      let sum = weighted(payload, &[8, 7, 6, 5, 4, 3, 2]) % 11;
      let raw = 11_u32.saturating_sub(sum) % 11;
      digit(*check) == if raw == 0 { 1 } else { raw % 10 }
    }
    9 if payload.first() == Some(&b'6') => {
      let sum =
        weighted(payload.get(1..).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2]) % 11;
      let inner = 21_u32.saturating_sub(sum) % 11;
      digit(*check) == 18_u32.saturating_sub(inner) % 10
    }
    _ => cz_rc(value),
  }
}

pub(super) fn de_idnr(value: &str) -> bool {
  let Some(bytes) = digits::<11>(value) else {
    return false;
  };
  let Some((check, payload)) = bytes.split_last() else {
    return false;
  };
  if payload.first() == Some(&b'0') {
    return false;
  }
  let mut counts = [0_u8; 10];
  for byte in payload {
    let index = usize::from(byte.saturating_sub(b'0'));
    let Some(count) = counts.get_mut(index) else {
      return false;
    };
    *count = count.saturating_add(1);
  }
  let mut doubles = 0_u8;
  let mut triples = 0_u8;
  for count in counts {
    match count {
      2 => doubles = doubles.saturating_add(1),
      3 => triples = triples.saturating_add(1),
      0 | 1 => {}
      _ => return false,
    }
  }
  matches!((doubles, triples), (1, 0) | (0, 1))
    && mod1110(payload) == Some(digit(*check))
}

pub(super) fn de_stnr(value: &str) -> bool {
  value.bytes().all(|byte| byte.is_ascii_digit())
    && matches!(value.len(), 10 | 11 | 13)
    && DE_STNR_PATTERNS
      .iter()
      .any(|pattern| de_stnr_pattern_matches(value, pattern))
}

pub(super) fn de_stnr_pattern_matches(value: &str, pattern: &str) -> bool {
  value.len() == pattern.len()
    && value.chars().zip(pattern.chars()).all(|(ch, marker)| {
      if marker.is_ascii_digit() {
        ch == marker
      } else {
        ch.is_ascii_digit()
      }
    })
}

pub(super) fn de_svnr(value: &str) -> bool {
  let Ok(bytes) = <&[u8; 12]>::try_from(value.as_bytes()) else {
    return false;
  };
  let &[a0, a1, d0, d1, m0, m1, y0, y1, initial, s0, s1, check] = bytes;
  let numeric = [a0, a1, d0, d1, m0, m1, y0, y1, s0, s1, check];
  if !numeric.iter().all(u8::is_ascii_digit) || !initial.is_ascii_uppercase() {
    return false;
  }
  let day = digit(d0).saturating_mul(10).saturating_add(digit(d1));
  let month = digit(m0).saturating_mul(10).saturating_add(digit(m1));
  let year = if y0 == b'0' && y1 == b'0' {
    2000
  } else {
    1900_u32
      .saturating_add(digit(y0).saturating_mul(10))
      .saturating_add(digit(y1))
  };
  if !valid_date(year, month, day) {
    return false;
  }
  let letter = u32::from(initial)
    .saturating_sub(u32::from(b'A'))
    .saturating_add(1);
  let payload = [
    digit(a0),
    digit(a1),
    digit(d0),
    digit(d1),
    digit(m0),
    digit(m1),
    digit(y0),
    digit(y1),
    letter.div_euclid(10),
    letter % 10,
    digit(s0),
    digit(s1),
  ];
  let sum = payload
    .iter()
    .zip([2_u32, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1])
    .fold(0_u32, |sum, (digit, weight)| {
      let product = digit.saturating_mul(weight);
      sum
        .saturating_add(product.div_euclid(10))
        .saturating_add(product % 10)
    });
  sum % 10 == digit(check)
}

pub(super) fn de_vat(value: &str) -> bool {
  let Some(bytes) = digits::<9>(value) else {
    return false;
  };
  let Some((check, payload)) = bytes.split_last() else {
    return false;
  };
  payload.first() != Some(&b'0') && mod1110(payload) == Some(digit(*check))
}

pub(super) fn fr_tva(value: &str) -> bool {
  let Ok(bytes) = <&[u8; 11]>::try_from(value.as_bytes()) else {
    return false;
  };
  let Some(prefix) = bytes.get(..2) else {
    return false;
  };
  let Some(siren) = bytes.get(2..) else {
    return false;
  };
  if !siren.iter().all(u8::is_ascii_digit)
    || (!siren.starts_with(b"000") && !luhn(siren).is_multiple_of(10))
  {
    return false;
  }
  let Some(c0) = FRENCH_TVA_ALPHABET
    .iter()
    .position(|byte| prefix.first() == Some(byte))
    .and_then(|index| u64::try_from(index).ok())
  else {
    return false;
  };
  let Some(c1) = FRENCH_TVA_ALPHABET
    .iter()
    .position(|byte| prefix.get(1) == Some(byte))
    .and_then(|index| u64::try_from(index).ok())
  else {
    return false;
  };
  let Some(siren_number) = number(siren) else {
    return false;
  };
  if c0 < 10 && c1 < 10 {
    return number(prefix)
      == Some(siren_number.saturating_mul(100).saturating_add(12) % 97);
  }
  let combined = if c0 < 10 {
    c0.saturating_mul(24).saturating_add(c1).saturating_sub(10)
  } else {
    c0.saturating_mul(34).saturating_add(c1).saturating_sub(100)
  };
  siren_number
    .saturating_add(1)
    .saturating_add(combined.div_euclid(11))
    % 11
    == combined % 11
}

pub(super) fn pl_nip(value: &str) -> bool {
  let Some(bytes) = digits::<10>(value) else {
    return false;
  };
  let Some((check, payload)) = bytes.split_last() else {
    return false;
  };
  let checksum = weighted(payload, &[6, 5, 7, 2, 3, 4, 5, 6, 7]) % 11;
  checksum < 10 && checksum == digit(*check)
}

pub(super) fn sk_dic(value: &str) -> bool {
  let Some(bytes) = digits::<10>(value) else {
    return false;
  };
  if cz_rc(value) {
    return true;
  }
  if bytes.first() == Some(&b'0')
    || !bytes.get(2).is_some_and(|byte| {
      matches!(byte, b'2' | b'3' | b'4' | b'7' | b'8' | b'9')
    })
  {
    return false;
  }
  number(bytes).is_some_and(|number| number.is_multiple_of(11))
}

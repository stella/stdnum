//! Core validation for standard identifiers.

const SPANISH_CHECK_LETTERS: &str = "TRWAGMYFPDXBNJZSQVHLCKE";
const SPANISH_CIF_LETTERS: &str = "JABCDEFGHI";
const FI_HETU_CHECK_CHARS: &str = "0123456789ABCDEFHJKLMNPRSTUVWXY";
const IE_PPS_ALPHABET: &str = "WABCDEFGHIJKLMNOPQRSTUV";
const DE_STNR_PATTERNS: &[&str] = &[
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
const INVALID_NINO_PREFIXES: &[(char, char)] = &[
  ('B', 'G'),
  ('G', 'B'),
  ('N', 'K'),
  ('K', 'N'),
  ('T', 'N'),
  ('N', 'T'),
  ('Z', 'Z'),
];

const SUPPORTED_VALIDATOR_IDS: &[&str] = &[
  "au.abn",
  "au.acn",
  "at.tin",
  "br.cnpj",
  "br.cpf",
  "cz.dic",
  "cz.rc",
  "de.idnr",
  "de.stnr",
  "es.cif",
  "es.dni",
  "es.nie",
  "es.nss",
  "fi.hetu",
  "fi.vat",
  "fi.ytunnus",
  "fr.siren",
  "gb.nhs",
  "gb.nino",
  "dk.cpr",
  "ie.pps",
  "no.mva",
  "no.orgnr",
  "us.ein",
  "us.rtn",
];

#[must_use]
pub const fn supported_validator_ids() -> &'static [&'static str] {
  SUPPORTED_VALIDATOR_IDS
}

#[must_use]
pub fn validate_named_id(validator: &str, value: &str) -> bool {
  validate_id(validator, value, None)
}

#[must_use]
pub fn validate_id(validator: &str, value: &str, input: Option<&str>) -> bool {
  let candidate = validator_candidate(value, input);
  match validator {
    "au.abn" => validate_au_abn(&candidate),
    "au.acn" => validate_au_acn(&candidate),
    "at.tin" => validate_at_tin(&candidate),
    "br.cnpj" => validate_cnpj(&candidate),
    "br.cpf" => validate_cpf(&candidate),
    "cz.dic" => validate_cz_dic(&candidate),
    "cz.rc" => validate_cz_rc(&candidate),
    "de.idnr" => validate_de_idnr(&candidate),
    "de.stnr" => validate_de_stnr(&candidate),
    "es.cif" => validate_es_cif(&candidate),
    "es.dni" => validate_es_dni(&candidate),
    "es.nie" => validate_es_nie(&candidate),
    "es.nss" => validate_es_nss(&candidate),
    "fi.hetu" => validate_fi_hetu(&candidate),
    "fi.vat" => validate_fi_vat(&candidate),
    "fi.ytunnus" => validate_fi_ytunnus(&candidate),
    "fr.siren" => validate_fr_siren(&candidate),
    "gb.nhs" => validate_gb_nhs(&candidate),
    "gb.nino" => validate_gb_nino(&candidate),
    "dk.cpr" => validate_dk_cpr(&candidate),
    "ie.pps" => validate_ie_pps(&candidate),
    "no.mva" => validate_no_mva(&candidate),
    "no.orgnr" => validate_no_orgnr(&candidate),
    "us.ein" => validate_us_ein(&candidate),
    "us.rtn" => validate_us_routing(&candidate),
    _ => false,
  }
}

fn validator_candidate(value: &str, input: Option<&str>) -> String {
  match input {
    Some("digits-only") => decimal_digit_chars(value).collect(),
    _ => value.to_owned(),
  }
}

fn validate_us_ein(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  if compact.len() != 9 || !is_ascii_digits(&compact) {
    return false;
  }
  let Some(prefix) = compact.get(0..2) else {
    return false;
  };
  matches!(
    prefix,
    "01"
      | "02"
      | "03"
      | "04"
      | "05"
      | "06"
      | "10"
      | "11"
      | "12"
      | "13"
      | "14"
      | "15"
      | "16"
      | "20"
      | "21"
      | "22"
      | "23"
      | "24"
      | "25"
      | "26"
      | "27"
      | "30"
      | "31"
      | "32"
      | "33"
      | "34"
      | "35"
      | "36"
      | "37"
      | "38"
      | "39"
      | "40"
      | "41"
      | "42"
      | "43"
      | "44"
      | "45"
      | "46"
      | "47"
      | "48"
      | "50"
      | "51"
      | "52"
      | "53"
      | "54"
      | "55"
      | "56"
      | "57"
      | "58"
      | "59"
      | "60"
      | "61"
      | "62"
      | "63"
      | "64"
      | "65"
      | "66"
      | "67"
      | "68"
      | "71"
      | "72"
      | "73"
      | "74"
      | "75"
      | "76"
      | "77"
      | "80"
      | "81"
      | "82"
      | "83"
      | "84"
      | "85"
      | "86"
      | "87"
      | "88"
      | "90"
      | "91"
      | "92"
      | "93"
      | "94"
      | "95"
      | "98"
      | "99"
  )
}

fn validate_cpf(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10] = digits;
  if digits.iter().all(|digit| *digit == d0) {
    return false;
  }
  let first = cpf_digit(&[d0, d1, d2, d3, d4, d5, d6, d7, d8], 10);
  let second = cpf_digit(&[d0, d1, d2, d3, d4, d5, d6, d7, d8, d9], 11);
  d9 == first && d10 == second
}

fn cpf_digit(digits: &[u32], weight_start: u32) -> u32 {
  let sum = digits
    .iter()
    .enumerate()
    .map(|(index, digit)| {
      let index = u32::try_from(index).unwrap_or(u32::MAX);
      digit.saturating_mul(weight_start.saturating_sub(index))
    })
    .sum::<u32>();
  let value = 11_u32.saturating_sub(sum.rem_euclid(11));
  if value >= 10 { 0 } else { value }
}

fn validate_cnpj(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.', '/']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 14]>::try_from(chars) else {
    return false;
  };
  if !chars
    .iter()
    .all(|ch| ch.is_ascii_digit() || ch.is_ascii_uppercase())
  {
    return false;
  }
  if chars.iter().take(12).all(|ch| *ch == '0') {
    return false;
  }
  let first = cnpj_digit(
    chars.get(..12).unwrap_or(&[]),
    &[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  let second = cnpj_digit(
    chars.get(..13).unwrap_or(&[]),
    &[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  chars.get(12).and_then(|ch| ascii_digit_value(*ch)) == Some(first)
    && chars.get(13).and_then(|ch| ascii_digit_value(*ch)) == Some(second)
}

fn cnpj_digit(chars: &[char], weights: &[u32]) -> u32 {
  let sum = chars
    .iter()
    .zip(weights)
    .filter_map(|(ch, weight)| {
      cnpj_char_value(*ch).map(|value| value.saturating_mul(*weight))
    })
    .sum::<u32>();
  let value = sum.rem_euclid(11);
  if value < 2 {
    0
  } else {
    11_u32.saturating_sub(value)
  }
}

fn cnpj_char_value(ch: char) -> Option<u32> {
  // Alphanumeric CNPJ uses ord(ch) - ord('0'), so A maps to 17.
  (ch.is_ascii_digit() || ch.is_ascii_uppercase())
    .then(|| u32::from(ch).saturating_sub(u32::from('0')))
}

fn validate_cz_rc(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '/']);
  let digits = decimal_digits_strict(&compact);
  let len = digits.len();
  if len != 9 && len != 10 {
    return false;
  }

  let Some(yy) = number_from_digits(digits.get(0..2)) else {
    return false;
  };
  let Some(raw_month) = number_from_digits(digits.get(2..4)) else {
    return false;
  };
  let Some(day) = number_from_digits(digits.get(4..6)) else {
    return false;
  };

  let mut year = 1900_u32.saturating_add(yy);
  if len == 9 {
    if year >= 1980 {
      year = year.saturating_sub(100);
    }
    if year > 1953 {
      return false;
    }
  } else if year < 1954 {
    year = year.saturating_add(100);
  }

  let Some(month) = decode_cz_month(raw_month, year, len) else {
    return false;
  };
  if !valid_date(year, month, day) {
    return false;
  }
  if len != 10 {
    return true;
  }

  let Some(front) = number_from_digits(digits.get(0..9)) else {
    return false;
  };
  let Some(check) = digits.get(9).copied() else {
    return false;
  };
  (front % 11) % 10 == check
}

fn decode_cz_month(raw_month: u32, year: u32, len: usize) -> Option<u32> {
  let offsets: &[u32] = if len == 10 && year >= 2004 {
    &[0, 50, 20, 70]
  } else {
    &[0, 50]
  };
  offsets.iter().find_map(|offset| {
    let month = raw_month.checked_sub(*offset)?;
    (1..=12).contains(&month).then_some(month)
  })
}

fn validate_cz_dic(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-']);
  if compact.starts_with("CZ") || compact.starts_with("cz") {
    compact = compact.chars().skip(2).collect();
  }
  let digits = decimal_digits_strict(&compact);
  if !(8..=10).contains(&digits.len()) {
    return false;
  }
  match digits.len() {
    8 => validate_cz_dic_legal(&digits),
    9 if digits.first() == Some(&6) => validate_cz_dic_special(&digits),
    9 | 10 => validate_cz_rc(&compact),
    _ => false,
  }
}

fn validate_cz_dic_legal(digits: &[u32]) -> bool {
  if digits.first() == Some(&9) {
    return false;
  }
  let Some(check) = digits.get(7).copied() else {
    return false;
  };
  let sum =
    weighted_sum(digits.get(0..7).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2])
      .rem_euclid(11);
  let v11 = 11_u32.saturating_sub(sum).rem_euclid(11);
  let expected = if v11 == 0 { 1 } else { v11 % 10 };
  check == expected
}

fn validate_cz_dic_special(digits: &[u32]) -> bool {
  let Some(check_digit) = digits.get(8).copied() else {
    return false;
  };
  let sum =
    weighted_sum(digits.get(1..8).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2])
      .rem_euclid(11);
  let inner = 10_u32.saturating_add(11).saturating_sub(sum).rem_euclid(11);
  let check = 8_u32
    .saturating_add(10)
    .saturating_sub(inner)
    .rem_euclid(10);
  check_digit == check
}

fn validate_de_idnr(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  if digits.first() == Some(&0) || !valid_de_idnr_distribution(&digits) {
    return false;
  }
  mod1110_check_digit(digits.get(..10).unwrap_or(&[]))
    == digits.get(10).copied()
}

fn valid_de_idnr_distribution(digits: &[u32; 11]) -> bool {
  let mut counts = [0_u8; 10];
  for digit in digits.iter().take(10) {
    let Ok(index) = usize::try_from(*digit) else {
      return false;
    };
    let Some(count) = counts.get_mut(index) else {
      return false;
    };
    *count = count.saturating_add(1);
  }
  let mut doubles = 0_u8;
  let mut triples = 0_u8;
  for count in counts {
    if count == 2 {
      doubles = doubles.saturating_add(1);
    }
    if count == 3 {
      triples = triples.saturating_add(1);
    }
    if count > 3 {
      return false;
    }
  }
  (doubles == 1 && triples == 0) || (doubles == 0 && triples == 1)
}

fn validate_de_stnr(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/', '.']);
  let digits = decimal_digits_strict(&compact);
  if !matches!(digits.len(), 10 | 11 | 13) {
    return false;
  }
  DE_STNR_PATTERNS
    .iter()
    .any(|pattern| de_stnr_pattern_matches(&compact, pattern))
}

fn de_stnr_pattern_matches(value: &str, pattern: &str) -> bool {
  if value.len() != pattern.len() {
    return false;
  }
  value.chars().zip(pattern.chars()).all(|(ch, marker)| {
    if marker.is_ascii_digit() {
      ch == marker
    } else {
      ch.is_ascii_digit()
    }
  })
}

fn validate_dk_cpr(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 10]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let [d0, d1, d2, d3, d4, d5, d6, _, _, _] = digits;
  let day = d0.saturating_mul(10).saturating_add(d1);
  let month = d2.saturating_mul(10).saturating_add(d3);
  let yy = d4.saturating_mul(10).saturating_add(d5);
  let year = dk_cpr_century(yy, d6).saturating_add(yy);
  valid_date(year, month, day)
}

const fn dk_cpr_century(yy: u32, serial_head: u32) -> u32 {
  if serial_head <= 3 {
    return 1900;
  }
  if serial_head == 4 || serial_head == 9 {
    return if yy <= 36 { 2000 } else { 1900 };
  }
  if serial_head >= 5 && serial_head <= 8 {
    return if yy <= 57 { 2000 } else { 1800 };
  }
  1900
}

fn validate_fi_hetu(value: &str) -> bool {
  let compact = compact_without(value, &[' ']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 11]>::try_from(chars) else {
    return false;
  };
  let [d0, d1, m0, m1, y0, y1, separator, s0, s1, s2, check] = chars;
  let date_chars = [d0, d1, m0, m1, y0, y1];
  let serial_chars = [s0, s1, s2];
  if !date_chars.iter().all(char::is_ascii_digit)
    || !serial_chars.iter().all(char::is_ascii_digit)
  {
    return false;
  }
  let Some(day) = number_from_ascii_digits(&[d0, d1]) else {
    return false;
  };
  let Some(month) = number_from_ascii_digits(&[m0, m1]) else {
    return false;
  };
  let Some(yy) = number_from_ascii_digits(&[y0, y1]) else {
    return false;
  };
  let Some(serial) = number_from_ascii_digits(&serial_chars) else {
    return false;
  };
  if !(2..900).contains(&serial) {
    return false;
  }
  let Some(century) = fi_hetu_century(separator) else {
    return false;
  };
  if !valid_date(century.saturating_add(yy), month, day) {
    return false;
  }
  let Some(check_number) =
    number_from_ascii_digits(&[d0, d1, m0, m1, y0, y1, s0, s1, s2])
  else {
    return false;
  };
  char_at(FI_HETU_CHECK_CHARS, check_number % 31) == Some(check)
}

const fn fi_hetu_century(separator: char) -> Option<u32> {
  match separator {
    '+' => Some(1800),
    '-' | 'Y' | 'X' | 'W' | 'V' | 'U' => Some(1900),
    'A' | 'B' | 'C' | 'D' | 'E' | 'F' => Some(2000),
    _ => None,
  }
}

fn validate_fi_vat(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/', '.']);
  let candidate = compact
    .strip_prefix("FI")
    .or_else(|| compact.strip_prefix("fi"))
    .unwrap_or(&compact);
  validate_fi_business_id_digits(candidate)
}

fn validate_fi_ytunnus(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/', '.']);
  validate_fi_business_id_digits(&compact)
}

fn validate_fi_business_id_digits(value: &str) -> bool {
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(value)) else {
    return false;
  };
  weighted_sum(&digits, &[7, 9, 10, 5, 8, 4, 2, 1]).is_multiple_of(11)
}

fn validate_es_nss(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/', '.']);
  let Ok(digits) = <[u32; 12]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let [p0, p1, a0, a1, a2, a3, a4, a5, a6, a7, c0, c1] = digits;
  let province = p0.saturating_mul(10).saturating_add(p1);
  if !(1..=52).contains(&province) {
    return false;
  }
  let affiliate_digits = [a0, a1, a2, a3, a4, a5, a6, a7];
  let Some(affiliate) = number_from_digits(Some(&affiliate_digits)) else {
    return false;
  };
  let check = c0.saturating_mul(10).saturating_add(c1);
  let base = if affiliate < 10_000_000 {
    affiliate.saturating_add(province.saturating_mul(10_000_000))
  } else {
    province
      .saturating_mul(100_000_000)
      .saturating_add(affiliate)
  };
  base.rem_euclid(97) == check
}

fn validate_fr_siren(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.']);
  let digits = decimal_digits_strict(&compact);
  digits.len() == 9 && luhn_checksum(&digits).is_multiple_of(10)
}

fn validate_gb_nhs(value: &str) -> bool {
  let compact = compact_without(value, &[' ']);
  let digits = decimal_digits_strict(&compact);
  let Ok(digits) = <[u32; 10]>::try_from(digits) else {
    return false;
  };
  let [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9] = digits;
  let total = weighted_sum(
    &[d0, d1, d2, d3, d4, d5, d6, d7, d8],
    &[10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  let check = 11_u32.saturating_sub(total.rem_euclid(11));
  let expected = match check {
    10 => return false,
    11 => 0,
    candidate => candidate,
  };
  d9 == expected
}

fn validate_gb_nino(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 9]>::try_from(chars) else {
    return false;
  };
  let [first, second, d0, d1, d2, d3, d4, d5, suffix] = chars;
  if !matches!(
    first,
    'A'
      | 'B'
      | 'C'
      | 'E'
      | 'G'
      | 'H'
      | 'J'
      | 'K'
      | 'L'
      | 'M'
      | 'N'
      | 'O'
      | 'P'
      | 'R'
      | 'S'
      | 'T'
      | 'W'
      | 'X'
      | 'Y'
      | 'Z'
  ) {
    return false;
  }
  if !matches!(
    second,
    'A'
      | 'B'
      | 'C'
      | 'E'
      | 'G'
      | 'H'
      | 'J'
      | 'K'
      | 'L'
      | 'M'
      | 'N'
      | 'P'
      | 'R'
      | 'S'
      | 'T'
      | 'W'
      | 'X'
      | 'Y'
      | 'Z'
  ) {
    return false;
  }
  if ![d0, d1, d2, d3, d4, d5].iter().all(char::is_ascii_digit) {
    return false;
  }
  if !matches!(suffix, 'A' | 'B' | 'C' | 'D') {
    return false;
  }
  !INVALID_NINO_PREFIXES.contains(&(first, second))
}

fn validate_ie_pps(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  if !(8..=9).contains(&chars.len()) {
    return false;
  }
  let Some(digits) = chars.get(..7) else {
    return false;
  };
  if !digits.iter().all(char::is_ascii_digit) {
    return false;
  }
  let Some(check_letter) = chars.get(7).copied() else {
    return false;
  };
  let mut sum = 0_u32;
  for (index, ch) in digits.iter().enumerate() {
    let Some(digit) = ascii_digit_value(*ch) else {
      return false;
    };
    let weight = 8_u32.saturating_sub(u32::try_from(index).unwrap_or(u32::MAX));
    sum = sum.saturating_add(digit.saturating_mul(weight));
  }
  if let Some(second_letter) = chars.get(8).copied()
    && second_letter != 'W'
  {
    let Some(index) = IE_PPS_ALPHABET.find(second_letter) else {
      return false;
    };
    sum = sum.saturating_add(
      9_u32.saturating_mul(u32::try_from(index).unwrap_or(u32::MAX)),
    );
  }
  let expected_index = sum.rem_euclid(23);
  char_at(IE_PPS_ALPHABET, expected_index) == Some(check_letter)
}

fn validate_es_dni(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  let mut chars = compact.chars();
  let Some(letter) = chars.next_back() else {
    return false;
  };
  let digits = chars.as_str();
  if digits.is_empty() || digits.len() > 8 {
    return false;
  }
  let Ok(number) = digits.parse::<u32>() else {
    return false;
  };
  spanish_check_letter(number) == Some(letter)
}

fn validate_es_nie(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 9]>::try_from(chars) else {
    return false;
  };
  let [prefix, d0, d1, d2, d3, d4, d5, d6, letter] = chars;
  let prefix_value: u32 = match prefix {
    'X' => 0,
    'Y' => 1,
    'Z' => 2,
    _ => return false,
  };
  let digits = [d0, d1, d2, d3, d4, d5, d6];
  let Some(number) = number_from_ascii_digits(&digits) else {
    return false;
  };
  spanish_check_letter(
    prefix_value
      .saturating_mul(10_000_000)
      .saturating_add(number),
  ) == Some(letter)
}

fn validate_es_cif(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-', '/', '.']);
  if compact.starts_with("ES") || compact.starts_with("es") {
    compact = compact.chars().skip(2).collect();
  }
  let compact = compact.to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 9]>::try_from(chars) else {
    return false;
  };
  let [prefix, d0, d1, d2, d3, d4, d5, d6, check] = chars;
  if !matches!(
    prefix,
    'A'
      | 'B'
      | 'C'
      | 'D'
      | 'E'
      | 'F'
      | 'G'
      | 'H'
      | 'J'
      | 'N'
      | 'P'
      | 'Q'
      | 'R'
      | 'S'
      | 'U'
      | 'V'
      | 'W'
  ) {
    return false;
  }
  let digits = [d0, d1, d2, d3, d4, d5, d6];
  if !digits.iter().all(char::is_ascii_digit) {
    return false;
  }
  let Some(cif_check) = spanish_cif_checksum(&digits) else {
    return false;
  };
  ascii_digit_value(check) == Some(cif_check)
    || char_at(SPANISH_CIF_LETTERS, cif_check) == Some(check)
}

fn spanish_check_letter(number: u32) -> Option<char> {
  char_at(SPANISH_CHECK_LETTERS, number % 23)
}

fn spanish_cif_checksum(digits: &[char; 7]) -> Option<u32> {
  let mut even = 0_u32;
  let mut odd = 0_u32;
  for (index, ch) in digits.iter().enumerate() {
    let digit = ascii_digit_value(*ch)?;
    if index.is_multiple_of(2) {
      let doubled = digit.saturating_mul(2);
      odd = odd.saturating_add(
        doubled
          .div_euclid(10)
          .saturating_add(doubled.rem_euclid(10)),
      );
    } else {
      even = even.saturating_add(digit);
    }
  }
  Some(
    10_u32
      .saturating_sub(even.saturating_add(odd).rem_euclid(10))
      .rem_euclid(10),
  )
}

fn validate_au_abn(value: &str) -> bool {
  const WEIGHTS: [i32; 11] = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let mut sum = 0_i32;
  for (index, (digit, weight)) in digits.iter().zip(WEIGHTS).enumerate() {
    let digit = i32::try_from(*digit).unwrap_or(i32::MAX);
    let adjusted = if index == 0 {
      digit.saturating_sub(1)
    } else {
      digit
    };
    sum = sum.saturating_add(adjusted.saturating_mul(weight));
  }
  sum.rem_euclid(89) == 0
}

fn validate_au_acn(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  let check = 10_u32
    .saturating_sub(
      weighted_sum(digits.get(..8).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2, 1])
        .rem_euclid(10),
    )
    .rem_euclid(10);
  digits.get(8).copied() == Some(check)
}

fn validate_at_tin(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.', '/', ',']);
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  at_tin_check_digit(digits.get(..8).unwrap_or(&[])) == digits.get(8).copied()
}

fn at_tin_check_digit(digits: &[u32]) -> Option<u32> {
  if digits.len() != 8 {
    return None;
  }
  let double = [0_u32, 2, 4, 6, 8, 1, 3, 5, 7, 9];
  let mut sum = 0_u32;
  for (index, digit) in digits.iter().enumerate() {
    let value = if index.is_multiple_of(2) {
      *digit
    } else {
      let digit_index = usize::try_from(*digit).ok()?;
      *double.get(digit_index)?
    };
    sum = sum.saturating_add(value);
  }
  Some(10_u32.saturating_sub(sum.rem_euclid(10)).rem_euclid(10))
}

fn validate_no_orgnr(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let digits = decimal_digits_strict(&compact);
  if digits.len() != 9 {
    return false;
  }
  weighted_sum(&digits, &[3, 2, 7, 6, 5, 4, 3, 2, 1]).is_multiple_of(11)
}

fn validate_no_mva(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-']).to_uppercase();
  if compact.starts_with("NO") {
    compact = compact.chars().skip(2).collect();
  }
  let Some(digits) = compact.strip_suffix("MVA") else {
    return false;
  };
  validate_no_orgnr(digits)
}

fn validate_us_routing(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  let [d0, d1, d2, d3, d4, d5, d6, d7, d8] = digits;
  let prefix = d0.saturating_mul(10).saturating_add(d1);
  if !((0..=12).contains(&prefix)
    || (21..=32).contains(&prefix)
    || (61..=72).contains(&prefix)
    || prefix == 80)
  {
    return false;
  }
  let first = d0.saturating_add(d3).saturating_add(d6).saturating_mul(3);
  let second = d1.saturating_add(d4).saturating_add(d7).saturating_mul(7);
  let checksum = first
    .saturating_add(second)
    .saturating_add(d2)
    .saturating_add(d5)
    .saturating_add(d8);
  checksum.is_multiple_of(10)
}

fn compact_without(value: &str, skipped: &[char]) -> String {
  let value = value.trim();
  let mut compact = String::with_capacity(value.len());
  for ch in value.chars() {
    let Some(normalized) = normalized_char(ch) else {
      continue;
    };
    if !skipped.contains(&normalized) {
      compact.push(normalized);
    }
  }
  compact
}

const fn normalized_char(ch: char) -> Option<char> {
  match ch {
    '\u{ff10}' => Some('0'),
    '\u{ff11}' => Some('1'),
    '\u{ff12}' => Some('2'),
    '\u{ff13}' => Some('3'),
    '\u{ff14}' => Some('4'),
    '\u{ff15}' => Some('5'),
    '\u{ff16}' => Some('6'),
    '\u{ff17}' => Some('7'),
    '\u{ff18}' => Some('8'),
    '\u{ff19}' => Some('9'),
    '\u{2010}' | '\u{2011}' | '\u{2012}' | '\u{2013}' | '\u{2014}'
    | '\u{2015}' | '\u{2212}' | '\u{fe58}' | '\u{fe63}' | '\u{ff0d}' => {
      Some('-')
    }
    '\u{2024}' | '\u{fe52}' | '\u{ff0e}' => Some('.'),
    '\u{00a0}' | '\u{2000}' | '\u{2001}' | '\u{2002}' | '\u{2003}'
    | '\u{2004}' | '\u{2005}' | '\u{2006}' | '\u{2007}' | '\u{2008}'
    | '\u{2009}' | '\u{200a}' | '\u{202f}' | '\u{205f}' | '\u{3000}' => {
      Some(' ')
    }
    '\u{ff0f}' | '\u{2044}' => Some('/'),
    '\u{200b}' | '\u{feff}' => None,
    _ => Some(ch),
  }
}

fn decimal_digits_strict(value: &str) -> Vec<u32> {
  if value.is_empty() {
    return Vec::new();
  }
  let mut digits = Vec::with_capacity(value.len());
  for ch in value.chars() {
    if !ch.is_ascii_digit() {
      return Vec::new();
    }
    if let Some(digit) = ch.to_digit(10) {
      digits.push(digit);
    }
  }
  digits
}

fn decimal_digit_chars(value: &str) -> impl Iterator<Item = char> + '_ {
  value.chars().filter(char::is_ascii_digit)
}

fn is_ascii_digits(value: &str) -> bool {
  !value.is_empty() && value.chars().all(|ch| ch.is_ascii_digit())
}

fn ascii_digit_value(ch: char) -> Option<u32> {
  ch.to_digit(10).filter(|_| ch.is_ascii_digit())
}

fn number_from_digits(digits: Option<&[u32]>) -> Option<u32> {
  digits?.iter().try_fold(0_u32, |total, digit| {
    total.checked_mul(10)?.checked_add(*digit)
  })
}

fn number_from_ascii_digits(chars: &[char]) -> Option<u32> {
  chars.iter().try_fold(0_u32, |total, ch| {
    total.checked_mul(10)?.checked_add(ascii_digit_value(*ch)?)
  })
}

fn char_at(text: &str, index: u32) -> Option<char> {
  usize::try_from(index)
    .ok()
    .and_then(|index| text.chars().nth(index))
}

fn weighted_sum(digits: &[u32], weights: &[u32]) -> u32 {
  digits
    .iter()
    .zip(weights)
    .map(|(digit, weight)| digit.saturating_mul(*weight))
    .sum()
}

fn mod1110_check_digit(payload: &[u32]) -> Option<u32> {
  if payload.is_empty() {
    return None;
  }
  let mut product = 10_u32;
  for digit in payload {
    let mut sum = digit.saturating_add(product).rem_euclid(10);
    if sum == 0 {
      sum = 10;
    }
    product = sum.saturating_mul(2).rem_euclid(11);
  }
  Some(11_u32.saturating_sub(product).rem_euclid(10))
}

fn luhn_checksum(digits: &[u32]) -> u32 {
  let mut sum = 0_u32;
  let mut double = false;
  for digit in digits.iter().rev() {
    let mut value = *digit;
    if double {
      value = value.saturating_mul(2);
      if value > 9 {
        value = value.saturating_sub(9);
      }
    }
    sum = sum.saturating_add(value);
    double = !double;
  }
  sum.rem_euclid(10)
}

fn valid_date(year: u32, month: u32, day: u32) -> bool {
  let days = match month {
    1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
    4 | 6 | 9 | 11 => 30,
    2 if is_leap_year(year) => 29,
    2 => 28,
    _ => return false,
  };
  (1..=days).contains(&day)
}

const fn is_leap_year(year: u32) -> bool {
  year.is_multiple_of(4) && !year.is_multiple_of(100)
    || year.is_multiple_of(400)
}

#[cfg(test)]
mod tests {
  #![allow(
    clippy::indexing_slicing,
    clippy::missing_assert_message,
    clippy::unwrap_used
  )]

  use super::{supported_validator_ids, validate_id, validate_named_id};

  #[test]
  fn exposes_supported_ids() {
    assert!(supported_validator_ids().contains(&"au.acn"));
    assert!(supported_validator_ids().contains(&"cz.rc"));
    assert!(supported_validator_ids().contains(&"de.idnr"));
    assert!(supported_validator_ids().contains(&"fi.ytunnus"));
    assert!(supported_validator_ids().contains(&"us.rtn"));
  }

  #[test]
  fn validates_known_good_values() {
    let cases = [
      ("au.abn", "51 824 753 556"),
      ("au.abn", "00000000019"),
      ("au.acn", "004 085 616"),
      ("at.tin", "59-119901/3"),
      ("br.cnpj", "33.000.167/0001-01"),
      ("br.cnpj", "12ABC34501DE35"),
      ("br.cpf", "390.533.447-05"),
      ("cz.dic", "CZ25123891"),
      ("cz.dic", "CZ600000008"),
      ("cz.rc", "710319/2745"),
      ("de.idnr", "36 574 261 809"),
      ("de.stnr", "2181508150"),
      ("dk.cpr", "211062-5629"),
      ("es.cif", "A13585625"),
      ("es.dni", "54362315K"),
      ("es.dni", "1234567L"),
      ("es.nie", "X5253868R"),
      ("es.nss", "28/12345678/40"),
      ("fi.hetu", "131052-308T"),
      ("fi.vat", "FI20774740"),
      ("fi.ytunnus", "2077474-0"),
      ("fr.siren", "552 008 443"),
      ("gb.nhs", "401 023 2137"),
      ("gb.nino", "AB 12 34 56 C"),
      ("ie.pps", "6433435F"),
      ("no.mva", "NO995525828MVA"),
      ("no.orgnr", "988 077 917"),
      ("us.ein", "04-2103594"),
      ("us.rtn", "111000025"),
    ];

    for (validator, value) in cases {
      assert!(validate_named_id(validator, value), "{validator}: {value}");
    }
  }

  #[test]
  fn rejects_known_bad_values() {
    let cases = [
      ("au.abn", "51 824 753 557"),
      ("au.abn", "00000000000"),
      ("au.acn", "004 085 617"),
      ("at.tin", "59-119901/4"),
      ("br.cnpj", "33.000.167/0001-02"),
      ("br.cpf", "111.111.111-11"),
      ("cz.dic", "CZ25123890"),
      ("cz.rc", "710319/2744"),
      ("de.idnr", "36 574 261 808"),
      ("de.stnr", "123"),
      ("dk.cpr", "321399-5629"),
      ("es.cif", "A13585626"),
      ("es.dni", "54362315A"),
      ("es.nie", "X5253868A"),
      ("es.nss", "28/12345678/41"),
      ("fi.hetu", "131052-308A"),
      ("fi.vat", "FI20774741"),
      ("fi.ytunnus", "2077474-1"),
      ("fr.siren", "552 008 444"),
      ("gb.nhs", "401 023 2138"),
      ("gb.nino", "GB 12 34 56 C"),
      ("ie.pps", "6433435A"),
      ("no.mva", "NO995525829MVA"),
      ("no.orgnr", "988 077 918"),
      ("us.ein", "00-2103594"),
      ("us.rtn", "111000026"),
    ];

    for (validator, value) in cases {
      assert!(!validate_named_id(validator, value), "{validator}: {value}");
    }
  }

  #[test]
  fn supports_digits_only_inputs() {
    assert!(validate_id(
      "us.rtn",
      "routing 111-000-025",
      Some("digits-only")
    ));
    assert!(!validate_id(
      "us.rtn",
      "routing 111-000-026",
      Some("digits-only")
    ));
  }

  #[test]
  fn rejects_unknown_validators() {
    assert!(!validate_named_id("unknown", "111000025"));
  }
}

//! Core validation for standard identifiers.

use std::time::{SystemTime, UNIX_EPOCH};

const AUSTRIAN_UID_LUHN_OFFSET: u32 = 6;
const BASE58_ALPHABET: &str =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH32_CHARSET: &str = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32_GENERATORS: [u32; 5] = [
  0x3b6a_57b2,
  0x2650_8e6d,
  0x1ea1_19fa,
  0x3d42_33dd,
  0x2a14_62b3,
];
const BECH32_CONST: u32 = 1;
const BECH32M_CONST: u32 = 0x2bc8_30a3;
const BECH32_CHECKSUM_LENGTH: usize = 6;
const BECH32_MIN_DATA_LENGTH: usize = 11;
const BECH32_MAX_DATA_LENGTH: usize = 71;
const BTC_BASE58_MIN_LENGTH: usize = 26;
const BTC_BASE58_MAX_LENGTH: usize = 35;
const BTC_BASE58_DECODED_LENGTH: usize = 25;
const BTC_CHECKSUM_LENGTH: usize = 4;
const BTC_MAINNET_P2PKH_VERSION: u8 = 0x00;
const BTC_MAINNET_P2SH_VERSION: u8 = 0x05;
const CH_UID_WEIGHTS: &[u32] = &[5, 4, 3, 2, 7, 6, 5, 4];
const CY_VAT_ODD_VALUES: &[u32] = &[1, 0, 5, 7, 9, 13, 15, 17, 19, 21];
const DIGITS_AND_UPPERCASE: &str = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FRENCH_TVA_ALPHABET: &str = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const IT_CODICE_FISCALE_CHECK_LETTERS: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PORTUGUESE_CC_ALPHABET: &str = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const RIC_CHECK_CHARS: &str = "10X98765432";
const RIC_WEIGHTS: &[u32] =
  &[7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ROMANIAN_CNP_COUNTIES: &[u32] = &[
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 51, 52, 70, 80, 81, 82, 83,
];
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
  "at.businessid",
  "at.tin",
  "at.uid",
  "be.nn",
  "be.vat",
  "bg.vat",
  "br.cnpj",
  "br.cpf",
  "ch.uid",
  "cn.ric",
  "crypto.wallet",
  "cy.vat",
  "cz.dic",
  "cz.rc",
  "de.idnr",
  "de.stnr",
  "de.svnr",
  "de.vat",
  "es.cif",
  "es.dni",
  "es.nie",
  "es.nss",
  "es.vat",
  "ee.ik",
  "ee.vat",
  "fi.hetu",
  "fi.vat",
  "fi.ytunnus",
  "fr.nir",
  "fr.siren",
  "fr.siret",
  "fr.tva",
  "gb.nhs",
  "gb.nino",
  "gb.vat",
  "gr.vat",
  "hr.vat",
  "hu.vat",
  "dk.cpr",
  "dk.vat",
  "ie.pps",
  "ie.vat",
  "it.codiceFiscale",
  "it.iva",
  "lt.asmens",
  "lt.vat",
  "lu.vat",
  "lv.vat",
  "mt.vat",
  "nl.vat",
  "no.mva",
  "no.orgnr",
  "pl.nip",
  "pl.pesel",
  "pt.cc",
  "pt.vat",
  "ro.cnp",
  "ro.vat",
  "se.personnummer",
  "si.vat",
  "sk.dic",
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
    "at.businessid" => validate_at_business_id(&candidate),
    "at.tin" => validate_at_tin(&candidate),
    "at.uid" => validate_at_uid(&candidate),
    "be.nn" => validate_be_nn(&candidate),
    "be.vat" => validate_be_vat(&candidate),
    "bg.vat" => validate_bg_vat(&candidate),
    "br.cnpj" => validate_cnpj(&candidate),
    "br.cpf" => validate_cpf(&candidate),
    "ch.uid" => validate_ch_uid(&candidate),
    "cn.ric" => validate_cn_ric(&candidate),
    "crypto.wallet" => validate_crypto_wallet(&candidate),
    "cy.vat" => validate_cy_vat(&candidate),
    "cz.dic" => validate_cz_dic(&candidate),
    "cz.rc" => validate_cz_rc(&candidate),
    "de.idnr" => validate_de_idnr(&candidate),
    "de.stnr" => validate_de_stnr(&candidate),
    "de.svnr" => validate_de_svnr(&candidate),
    "de.vat" => validate_de_vat(&candidate),
    "ee.ik" => validate_ee_ik(&candidate),
    "ee.vat" => validate_ee_vat(&candidate),
    "es.cif" => validate_es_cif(&candidate),
    "es.dni" => validate_es_dni(&candidate),
    "es.nie" => validate_es_nie(&candidate),
    "es.nss" => validate_es_nss(&candidate),
    "es.vat" => validate_es_vat(&candidate),
    "fi.hetu" => validate_fi_hetu(&candidate),
    "fi.vat" => validate_fi_vat(&candidate),
    "fi.ytunnus" => validate_fi_ytunnus(&candidate),
    "fr.nir" => validate_fr_nir(&candidate),
    "fr.siren" => validate_fr_siren(&candidate),
    "fr.siret" => validate_fr_siret(&candidate),
    "fr.tva" => validate_fr_tva(&candidate),
    "gb.nhs" => validate_gb_nhs(&candidate),
    "gb.nino" => validate_gb_nino(&candidate),
    "gb.vat" => validate_gb_vat(&candidate),
    "gr.vat" => validate_gr_vat(&candidate),
    "hr.vat" => validate_hr_vat(&candidate),
    "hu.vat" => validate_hu_vat(&candidate),
    "dk.cpr" => validate_dk_cpr(&candidate),
    "dk.vat" => validate_dk_vat(&candidate),
    "ie.pps" => validate_ie_pps(&candidate),
    "ie.vat" => validate_ie_vat(&candidate),
    "it.codiceFiscale" => validate_it_codice_fiscale(&candidate),
    "it.iva" => validate_it_iva(&candidate),
    "lt.asmens" => validate_lt_asmens(&candidate),
    "lt.vat" => validate_lt_vat(&candidate),
    "lu.vat" => validate_lu_vat(&candidate),
    "lv.vat" => validate_lv_vat(&candidate),
    "mt.vat" => validate_mt_vat(&candidate),
    "nl.vat" => validate_nl_vat(&candidate),
    "no.mva" => validate_no_mva(&candidate),
    "no.orgnr" => validate_no_orgnr(&candidate),
    "pl.nip" => validate_pl_nip(&candidate),
    "pl.pesel" => validate_pl_pesel(&candidate),
    "pt.cc" => validate_pt_cc(&candidate),
    "pt.vat" => validate_pt_vat(&candidate),
    "ro.cnp" => validate_ro_cnp(&candidate),
    "ro.vat" => validate_ro_vat(&candidate),
    "se.personnummer" => validate_se_personnummer(&candidate),
    "si.vat" => validate_si_vat(&candidate),
    "sk.dic" => validate_sk_dic(&candidate),
    "us.ein" => validate_us_ein(&candidate),
    "us.rtn" => validate_us_routing(&candidate),
    _ => false,
  }
}

fn validator_candidate(value: &str, input: Option<&str>) -> String {
  match input {
    Some("digits-only") => decimal_digit_chars(value).collect(),
    Some("crypto-wallet-candidate") => crypto_wallet_candidate(value),
    _ => value.to_owned(),
  }
}

fn validate_at_business_id(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-', '/', '.']);
  if starts_with_ignore_ascii_case(&compact, "FN") {
    compact = compact.chars().skip(2).collect();
  }
  let mut chars = compact.chars();
  let Some(last) = chars.next_back() else {
    return false;
  };
  compact.len() >= 2
    && last.is_ascii_alphabetic()
    && chars.all(|ch| ch.is_ascii_digit())
}

fn validate_at_uid(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-', '/']);
  if starts_with_ignore_ascii_case(&compact, "AT") {
    compact = compact.chars().skip(2).collect();
  }
  let compact = compact.to_uppercase();
  let mut chars = compact.chars();
  if chars.next() != Some('U') || compact.len() != 9 {
    return false;
  }
  let digits = decimal_digits_strict(chars.as_str());
  let Ok(digits) = <[u32; 8]>::try_from(digits) else {
    return false;
  };
  let check = AUSTRIAN_UID_LUHN_OFFSET
    .saturating_add(10)
    .saturating_sub(luhn_checksum(digits.get(..7).unwrap_or(&[])))
    .rem_euclid(10);
  digits.get(7).copied() == Some(check)
}

fn validate_be_nn(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '.', '-']);
  let digits = decimal_digits_strict(&compact);
  if digits.len() != 11 || digits.iter().all(|digit| *digit == 0) {
    return false;
  }
  let Some(raw_month) = number_from_digits(digits.get(2..4)) else {
    return false;
  };
  raw_month <= 12 && be_nn_century(&compact).is_some()
}

fn be_nn_century(value: &str) -> Option<u32> {
  let first9 = value.get(0..9)?.parse::<u64>().ok()?;
  let check = value.get(9..11)?.parse::<u64>().ok()?;
  if 97_u64.saturating_sub(first9.rem_euclid(97)) == check {
    return Some(1900);
  }
  let yy = value.get(0..2)?.parse::<u32>().ok()?;
  if yy.saturating_add(2000) <= current_year() {
    let with2 = value
      .get(0..9)?
      .parse::<u64>()
      .ok()?
      .saturating_add(2_000_000_000);
    if 97_u64.saturating_sub(with2.rem_euclid(97)) == check {
      return Some(2000);
    }
  }
  None
}

fn validate_be_vat(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-', '/', '.']);
  if starts_with_ignore_ascii_case(&compact, "BE") {
    compact = compact.chars().skip(2).collect();
  }
  if compact.len() == 9 {
    compact.insert(0, '0');
  }
  let digits = decimal_digits_strict(&compact);
  if digits.len() != 10 || digits.iter().all(|digit| *digit == 0) {
    return false;
  }
  if !matches!(digits.first(), Some(0 | 1)) {
    return false;
  }
  let Some(front) = number_from_digits(digits.get(..8)) else {
    return false;
  };
  let Some(check) = number_from_digits(digits.get(8..10)) else {
    return false;
  };
  front.saturating_add(check).is_multiple_of(97)
}

fn validate_bg_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "BG");
  let digits = decimal_digits_strict(&compact);
  match digits.len() {
    9 => validate_bg_vat_9(&digits),
    10 => {
      validate_bg_vat_egn(&digits)
        || validate_bg_vat_pnf(&digits)
        || validate_bg_vat_other(&digits)
    }
    _ => false,
  }
}

fn validate_bg_vat_9(digits: &[u32]) -> bool {
  let Some(check_digit) = digits.get(8).copied() else {
    return false;
  };
  let payload = digits.get(..8).unwrap_or(&[]);
  let mut check =
    weighted_sum(payload, &[1, 2, 3, 4, 5, 6, 7, 8]).rem_euclid(11);
  if check == 10 {
    check = weighted_sum(payload, &[3, 4, 5, 6, 7, 8, 9, 10]).rem_euclid(11);
  }
  check.rem_euclid(10) == check_digit
}

fn validate_bg_vat_egn(digits: &[u32]) -> bool {
  let Some(year) = two_digit_number(digits, 0) else {
    return false;
  };
  let Some(mut month) = two_digit_number(digits, 2) else {
    return false;
  };
  let Some(day) = two_digit_number(digits, 4) else {
    return false;
  };
  let mut full_year = year.saturating_add(1900);
  if month > 40 {
    full_year = full_year.saturating_add(100);
    month = month.saturating_sub(40);
  } else if month > 20 {
    full_year = full_year.saturating_sub(100);
    month = month.saturating_sub(20);
  }
  if !valid_date(full_year, month, day) {
    return false;
  }
  let Some(check_digit) = digits.get(9).copied() else {
    return false;
  };
  weighted_sum(
    digits.get(..9).unwrap_or(&[]),
    &[2, 4, 8, 5, 10, 9, 7, 3, 6],
  )
  .rem_euclid(11)
  .rem_euclid(10)
    == check_digit
}

fn validate_bg_vat_pnf(digits: &[u32]) -> bool {
  let Some(check_digit) = digits.get(9).copied() else {
    return false;
  };
  weighted_sum(
    digits.get(..9).unwrap_or(&[]),
    &[21, 19, 17, 13, 11, 9, 7, 3, 1],
  )
  .rem_euclid(10)
    == check_digit
}

fn validate_bg_vat_other(digits: &[u32]) -> bool {
  let Some(check_digit) = digits.get(9).copied() else {
    return false;
  };
  let sum =
    weighted_sum(digits.get(..9).unwrap_or(&[]), &[4, 3, 2, 7, 6, 5, 4, 3, 2])
      .rem_euclid(11);
  11_u32.saturating_sub(sum).rem_euclid(11) == check_digit
}

fn validate_ch_uid(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.', '/']).to_uppercase();
  let Some(digits_text) = compact.strip_prefix("CHE") else {
    return false;
  };
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(digits_text))
  else {
    return false;
  };
  let check = 11_u32
    .saturating_sub(
      weighted_sum(digits.get(..8).unwrap_or(&[]), CH_UID_WEIGHTS)
        .rem_euclid(11),
    )
    .rem_euclid(11);
  check != 10 && digits.get(8).copied() == Some(check)
}

fn validate_cy_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "CY")
    .to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 9]>::try_from(chars) else {
    return false;
  };
  if chars
    .get(..8)
    .unwrap_or(&[])
    .iter()
    .any(|ch| !ch.is_ascii_digit())
    || !chars.get(8).is_some_and(char::is_ascii_uppercase)
    || chars.get(..2) == Some(&['1', '2'])
  {
    return false;
  }
  let mut odd = 0_u32;
  let mut even = 0_u32;
  for (index, ch) in chars.iter().take(8).enumerate() {
    let Some(digit) = ascii_digit_value(*ch) else {
      return false;
    };
    if index.is_multiple_of(2) {
      let Ok(digit_index) = usize::try_from(digit) else {
        return false;
      };
      odd =
        odd.saturating_add(*CY_VAT_ODD_VALUES.get(digit_index).unwrap_or(&0));
    } else {
      even = even.saturating_add(digit);
    }
  }
  char_at(
    DIGITS_AND_UPPERCASE
      .get(10..)
      .unwrap_or("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    odd.saturating_add(even).rem_euclid(26),
  ) == chars.get(8).copied()
}

fn validate_cn_ric(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  match chars.len() {
    15 => validate_cn_ric_legacy(&chars),
    18 => validate_cn_ric_modern(&chars),
    _ => false,
  }
}

fn validate_cn_ric_legacy(chars: &[char]) -> bool {
  if !chars.iter().all(char::is_ascii_digit) {
    return false;
  }
  let Some(year) = number_from_ascii_digits(chars.get(6..8).unwrap_or(&[]))
  else {
    return false;
  };
  let Some(month) = number_from_ascii_digits(chars.get(8..10).unwrap_or(&[]))
  else {
    return false;
  };
  let Some(day) = number_from_ascii_digits(chars.get(10..12).unwrap_or(&[]))
  else {
    return false;
  };
  valid_date(year.saturating_add(1900), month, day)
}

fn validate_cn_ric_modern(chars: &[char]) -> bool {
  let Some(payload) = chars.get(..17) else {
    return false;
  };
  if !payload.iter().all(char::is_ascii_digit) {
    return false;
  }
  let Some(check) = chars.get(17).copied() else {
    return false;
  };
  if !check.is_ascii_digit() && check != 'X' {
    return false;
  }
  let Some(year) = number_from_ascii_digits(chars.get(6..10).unwrap_or(&[]))
  else {
    return false;
  };
  let Some(month) = number_from_ascii_digits(chars.get(10..12).unwrap_or(&[]))
  else {
    return false;
  };
  let Some(day) = number_from_ascii_digits(chars.get(12..14).unwrap_or(&[]))
  else {
    return false;
  };
  valid_date(year, month, day) && ric_check_char(payload) == Some(check)
}

fn ric_check_char(payload: &[char]) -> Option<char> {
  let mut sum = 0_u32;
  for (ch, weight) in payload.iter().zip(RIC_WEIGHTS) {
    sum = sum.saturating_add(ascii_digit_value(*ch)?.saturating_mul(*weight));
  }
  char_at(RIC_CHECK_CHARS, sum.rem_euclid(11))
}

fn validate_crypto_wallet(value: &str) -> bool {
  validate_eth_address(value)
    || validate_btc_bech32_address(value)
    || validate_btc_base58_address(value)
}

fn crypto_wallet_candidate(value: &str) -> String {
  for raw in value.split_whitespace() {
    let candidate = raw.trim_matches(|ch: char| {
      matches!(
        ch,
        ':' | ';' | ',' | '.' | '(' | ')' | '[' | ']' | '{' | '}'
      )
    });
    if crypto_candidate_shape(candidate) {
      return candidate.to_owned();
    }
  }
  value.trim().to_owned()
}

fn crypto_candidate_shape(value: &str) -> bool {
  let lower = value.to_lowercase();
  (lower.starts_with("0x") && value.len() == 42)
    || (value.len() >= BTC_BASE58_MIN_LENGTH
      && value.len() <= BTC_BASE58_MAX_LENGTH
      && value.starts_with(['1', '3']))
    || (lower.starts_with("bc1")
      && lower.len().saturating_sub(3) >= BECH32_MIN_DATA_LENGTH
      && lower.len().saturating_sub(3) <= BECH32_MAX_DATA_LENGTH)
}

fn validate_eth_address(value: &str) -> bool {
  let raw = compact_without(value, &[' ']);
  let lower = raw.to_lowercase();
  let Some(body) = raw.get(2..) else {
    return false;
  };
  lower.len() == 42
    && lower.starts_with("0x")
    && body.chars().all(|ch| ch.is_ascii_hexdigit())
    && eth_has_valid_eip55_checksum(body)
}

fn eth_has_valid_eip55_checksum(body: &str) -> bool {
  let has_lower = body.chars().any(|ch| ch.is_ascii_lowercase());
  let has_upper = body.chars().any(|ch| ch.is_ascii_uppercase());
  if !has_lower || !has_upper {
    return true;
  }
  let lower = body.to_lowercase();
  let hash = keccak256_hex(lower.as_bytes());
  for (index, ch) in body.chars().enumerate() {
    if ch.is_ascii_digit() {
      continue;
    }
    let Some(nibble) =
      hash.chars().nth(index).and_then(|value| value.to_digit(16))
    else {
      return false;
    };
    let expected = if nibble >= 8 {
      ch.to_ascii_uppercase()
    } else {
      ch.to_ascii_lowercase()
    };
    if ch != expected {
      return false;
    }
  }
  true
}

fn validate_btc_base58_address(value: &str) -> bool {
  let compact = compact_without(value, &[' ']);
  if compact.len() < BTC_BASE58_MIN_LENGTH
    || compact.len() > BTC_BASE58_MAX_LENGTH
    || !compact.starts_with(['1', '3'])
  {
    return false;
  }
  let Some(decoded) = decode_base58(&compact) else {
    return false;
  };
  if decoded.len() != BTC_BASE58_DECODED_LENGTH {
    return false;
  }
  let Some(version) = decoded.first().copied() else {
    return false;
  };
  if version != BTC_MAINNET_P2PKH_VERSION && version != BTC_MAINNET_P2SH_VERSION
  {
    return false;
  }
  btc_base58_checksum_valid(&decoded)
}

fn decode_base58(value: &str) -> Option<Vec<u8>> {
  let mut little_endian = vec![0_u8];
  for ch in value.chars() {
    let digit = BASE58_ALPHABET.find(ch)?;
    let mut carry = u32::try_from(digit).ok()?;
    for byte in &mut little_endian {
      let decoded_value =
        u32::from(*byte).saturating_mul(58).saturating_add(carry);
      *byte = u8::try_from(decoded_value % 256).ok()?;
      carry = decoded_value.div_euclid(256);
    }
    while carry > 0 {
      little_endian.push(u8::try_from(carry % 256).ok()?);
      carry /= 256;
    }
  }
  let leading_zeros = value.chars().take_while(|ch| *ch == '1').count();
  let mut result = vec![0_u8; leading_zeros];
  result.extend(
    little_endian
      .iter()
      .rev()
      .copied()
      .skip_while(|byte| *byte == 0),
  );
  Some(result)
}

fn btc_base58_checksum_valid(decoded: &[u8]) -> bool {
  if decoded.len() <= BTC_CHECKSUM_LENGTH {
    return false;
  }
  let payload_end = decoded.len().saturating_sub(BTC_CHECKSUM_LENGTH);
  let Some(payload) = decoded.get(..payload_end) else {
    return false;
  };
  let Some(checksum) = decoded.get(payload_end..) else {
    return false;
  };
  let first = sha256(payload);
  let digest = sha256(&first);
  digest.get(..BTC_CHECKSUM_LENGTH) == Some(checksum)
}

fn validate_btc_bech32_address(value: &str) -> bool {
  let raw = compact_without(value, &[' ']);
  let has_lower = raw.chars().any(|ch| ch.is_ascii_lowercase());
  let has_upper = raw.chars().any(|ch| ch.is_ascii_uppercase());
  if has_lower && has_upper {
    return false;
  }
  let compact = raw.to_lowercase();
  let Some(data) = compact.strip_prefix("bc1") else {
    return false;
  };
  if data.len() < BECH32_MIN_DATA_LENGTH || data.len() > BECH32_MAX_DATA_LENGTH
  {
    return false;
  }
  let Some(values) = bech32_data_values(data) else {
    return false;
  };
  let mut expanded = vec![3_u32, 3, 0, 2, 3];
  expanded.extend(values.iter().copied());
  let check = bech32_polymod(&expanded);
  let Some(version) = values.first().copied() else {
    return false;
  };
  if version > 16 {
    return false;
  }
  if (version == 0 && check != BECH32_CONST)
    || (version > 0 && check != BECH32M_CONST)
  {
    return false;
  }
  let end = values.len().saturating_sub(BECH32_CHECKSUM_LENGTH);
  let Some(program_values) = values.get(1..end) else {
    return false;
  };
  let Some(program) = convert_bits(program_values, 5, 8) else {
    return false;
  };
  (2..=40).contains(&program.len())
    && (version != 0 || matches!(program.len(), 20 | 32))
}

fn bech32_data_values(data: &str) -> Option<Vec<u32>> {
  let mut values = Vec::with_capacity(data.len());
  for ch in data.chars() {
    values.push(u32::try_from(BECH32_CHARSET.find(ch)?).ok()?);
  }
  Some(values)
}

fn bech32_polymod(values: &[u32]) -> u32 {
  let mut check = 1_u32;
  for value in values {
    let top = check >> 25;
    check = ((check & 0x01ff_ffff) << 5) ^ value;
    for (index, generator) in BECH32_GENERATORS.iter().enumerate() {
      let Ok(shift) = u32::try_from(index) else {
        continue;
      };
      if ((top >> shift) & 1) == 1 {
        check ^= generator;
      }
    }
  }
  check
}

fn convert_bits(
  values: &[u32],
  from_bits: u32,
  to_bits: u32,
) -> Option<Vec<u32>> {
  let mut accumulator = 0_u32;
  let mut bits = 0_u32;
  let max_value = (1_u32 << to_bits).saturating_sub(1);
  let mut result = Vec::new();
  for value in values {
    if *value >> from_bits != 0 {
      return None;
    }
    accumulator = (accumulator << from_bits) | value;
    bits = bits.saturating_add(from_bits);
    while bits >= to_bits {
      bits = bits.saturating_sub(to_bits);
      result.push((accumulator >> bits) & max_value);
    }
  }
  if bits >= from_bits
    || ((accumulator << (to_bits.saturating_sub(bits))) & max_value) != 0
  {
    return None;
  }
  Some(result)
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

fn validate_de_svnr(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '/']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 12]>::try_from(chars) else {
    return false;
  };
  let [a0, a1, d0, d1, m0, m1, y0, y1, initial, s0, s1, check] = chars;
  if ![a0, a1, d0, d1, m0, m1, y0, y1, s0, s1, check]
    .iter()
    .all(char::is_ascii_digit)
    || !initial.is_ascii_uppercase()
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
  if !valid_date(resolve_two_digit_year(yy), month, day) {
    return false;
  }
  de_svnr_check_digit(&chars) == ascii_digit_value(check)
}

fn de_svnr_check_digit(chars: &[char; 12]) -> Option<u32> {
  let mut digits = Vec::with_capacity(12);
  for ch in chars.iter().take(8) {
    digits.push(ascii_digit_value(*ch)?);
  }
  let letter_value = u32::from(chars.get(8).copied()?)
    .saturating_sub(u32::from('A'))
    .saturating_add(1);
  digits.push(letter_value.div_euclid(10));
  digits.push(letter_value % 10);
  digits.push(ascii_digit_value(chars.get(9).copied()?)?);
  digits.push(ascii_digit_value(chars.get(10).copied()?)?);
  let mut sum = 0_u32;
  for (digit, weight) in digits.iter().zip([2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1])
  {
    let product = digit.saturating_mul(weight);
    sum = sum
      .saturating_add(product.div_euclid(10))
      .saturating_add(product % 10);
  }
  Some(sum.rem_euclid(10))
}

fn validate_de_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/'], "DE");
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  digits.first() != Some(&0)
    && mod1110_check_digit(digits.get(..8).unwrap_or(&[]))
      == digits.get(8).copied()
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
  if !valid_date(year, month, day) {
    return false;
  }
  // Reject future birth dates, matching src/dk/cpr.ts. Serial heads that map
  // yy into the 2000s can otherwise resolve to a not-yet-assignable date.
  (year, month, day) <= current_date()
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

fn validate_dk_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "DK");
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  digits.first() != Some(&0)
    && weighted_sum(&digits, &[2, 7, 6, 5, 4, 3, 2, 1]).is_multiple_of(11)
}

fn validate_ee_ik(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let Some(gender_century) = digits.first().copied() else {
    return false;
  };
  let century: u32 = match gender_century {
    1 | 2 => 1800,
    3 | 4 => 1900,
    5 | 6 => 2000,
    _ => return false,
  };
  let Some(yy) = two_digit_number(&digits, 1) else {
    return false;
  };
  let Some(month) = two_digit_number(&digits, 3) else {
    return false;
  };
  let Some(day) = two_digit_number(&digits, 5) else {
    return false;
  };
  valid_date(century.saturating_add(yy), month, day)
    && two_pass_personal_check(digits.get(..10).unwrap_or(&[]))
      == digits.get(10).copied()
}

fn validate_ee_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "EE");
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  weighted_sum(&digits, &[3, 7, 1, 3, 7, 1, 3, 7, 1]).is_multiple_of(10)
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
  // Widen to u64 before combining: for provinces 43-52 with an 8-digit
  // affiliate the concatenated base exceeds u32::MAX (e.g. 493961665403 →
  // 4_939_616_654), which would otherwise saturate and disagree with the TS
  // validator.
  let base = if affiliate < 10_000_000 {
    u64::from(affiliate)
      .saturating_add(u64::from(province).saturating_mul(10_000_000))
  } else {
    u64::from(province)
      .saturating_mul(100_000_000)
      .saturating_add(u64::from(affiliate))
  };
  base.rem_euclid(97) == u64::from(check)
}

fn validate_fr_siren(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.']);
  let digits = decimal_digits_strict(&compact);
  digits.len() == 9 && luhn_checksum(&digits).is_multiple_of(10)
}

fn validate_fr_nir(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  if chars.len() != 15 || !matches!(chars.first(), Some('1' | '2')) {
    return false;
  }
  if !chars
    .get(1..5)
    .unwrap_or(&[])
    .iter()
    .all(char::is_ascii_digit)
  {
    return false;
  }
  let Some(month) = number_from_ascii_digits(chars.get(3..5).unwrap_or(&[]))
  else {
    return false;
  };
  if month == 0 {
    return false;
  }
  let department = chars.get(5..7).unwrap_or(&[]);
  let corsica = department == ['2', 'A'] || department == ['2', 'B'];
  if !corsica && !department.iter().all(char::is_ascii_digit) {
    return false;
  }
  if !chars
    .get(7..15)
    .unwrap_or(&[])
    .iter()
    .all(char::is_ascii_digit)
  {
    return false;
  }
  let mut numeric_base = String::with_capacity(13);
  numeric_base.extend(chars.iter().take(5));
  if department == ['2', 'A'] {
    numeric_base.push_str("19");
  } else if department == ['2', 'B'] {
    numeric_base.push_str("18");
  } else {
    numeric_base.extend(department);
  }
  numeric_base.extend(chars.iter().skip(7).take(6));
  let Some(base) = numeric_base.parse::<u64>().ok() else {
    return false;
  };
  let Some(check) = compact
    .get(13..15)
    .and_then(|text| text.parse::<u64>().ok())
  else {
    return false;
  };
  97_u64.saturating_sub(base.rem_euclid(97)) == check
}

fn validate_fr_siret(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-', '.']);
  let digits = decimal_digits_strict(&compact);
  if digits.len() != 14 {
    return false;
  }
  let siren = digits.get(..9).unwrap_or(&[]);
  let la_poste =
    compact.starts_with("356000000") && compact != "35600000000048";
  if !la_poste && !luhn_checksum(siren).is_multiple_of(10) {
    return false;
  }
  if la_poste {
    digits.iter().sum::<u32>().is_multiple_of(5)
  } else {
    luhn_checksum(&digits).is_multiple_of(10)
  }
}

fn validate_fr_tva(value: &str) -> bool {
  let compact =
    strip_prefix_after_compact(value, &[' ', '-', '.'], "FR").to_uppercase();
  if compact.len() != 11 {
    return false;
  }
  let Some(prefix) = compact.get(0..2) else {
    return false;
  };
  let Some(siren) = compact.get(2..) else {
    return false;
  };
  if !is_ascii_digits(siren) {
    return false;
  }
  if !siren.starts_with("000") && !validate_fr_siren(siren) {
    return false;
  }
  let mut prefix_chars = prefix.chars();
  let Some(first) = prefix_chars.next() else {
    return false;
  };
  let Some(second) = prefix_chars.next() else {
    return false;
  };
  let Some(c0) = FRENCH_TVA_ALPHABET.find(first) else {
    return false;
  };
  let Some(c1) = FRENCH_TVA_ALPHABET.find(second) else {
    return false;
  };
  let Ok(c0) = u64::try_from(c0) else {
    return false;
  };
  let Ok(c1) = u64::try_from(c1) else {
    return false;
  };
  let Some(siren_number) = siren.parse::<u64>().ok() else {
    return false;
  };
  if c0 < 10 && c1 < 10 {
    return prefix.parse::<u64>().ok()
      == Some(
        siren_number
          .saturating_mul(100)
          .saturating_add(12)
          .rem_euclid(97),
      );
  }
  let combined = if c0 < 10 {
    c0.saturating_mul(24).saturating_add(c1).saturating_sub(10)
  } else {
    c0.saturating_mul(34).saturating_add(c1).saturating_sub(100)
  };
  siren_number
    .saturating_add(1)
    .saturating_add(combined.div_euclid(11))
    .rem_euclid(11)
    == combined.rem_euclid(11)
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

fn validate_gb_vat(value: &str) -> bool {
  let compact =
    strip_prefix_after_compact(value, &[' ', '-', '.'], "GB").to_uppercase();
  if let Some(number) = compact.strip_prefix("GD") {
    return number.len() == 3
      && is_ascii_digits(number)
      && number.parse::<u32>().is_ok_and(|parsed| parsed < 500);
  }
  if let Some(number) = compact.strip_prefix("HA") {
    return number.len() == 3
      && is_ascii_digits(number)
      && number.parse::<u32>().is_ok_and(|parsed| parsed >= 500);
  }
  if !matches!(compact.len(), 9 | 12) || !is_ascii_digits(&compact) {
    return false;
  }
  compact.get(..9).is_some_and(validate_gb_standard_vat)
}

fn validate_gb_standard_vat(value: &str) -> bool {
  let digits = decimal_digits_strict(value);
  if digits.len() != 9 {
    return false;
  }
  let sum =
    weighted_sum(digits.get(..7).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2])
      .rem_euclid(97);
  let Some(check) = number_from_digits(digits.get(7..9)) else {
    return false;
  };
  let total = sum.saturating_add(check).rem_euclid(97);
  let Some(prefix) = number_from_digits(digits.get(..3)) else {
    return false;
  };
  if prefix >= 100 {
    matches!(total, 0 | 42 | 55)
  } else {
    total == 0
  }
}

fn validate_gr_vat(value: &str) -> bool {
  let mut compact = compact_without(value, &[' ', '-', '/', '.']);
  if starts_with_ignore_ascii_case(&compact, "EL")
    || starts_with_ignore_ascii_case(&compact, "GR")
  {
    compact = compact.chars().skip(2).collect();
  }
  if compact.len() == 8 {
    compact.insert(0, '0');
  }
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  let mut check = 0_u32;
  for digit in digits.iter().take(8) {
    check = check.saturating_mul(2).saturating_add(*digit);
  }
  check.saturating_mul(2).rem_euclid(11).rem_euclid(10)
    == digits.get(8).copied().unwrap_or(u32::MAX)
}

fn validate_hr_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "HR");
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  mod1110_check_digit(digits.get(..10).unwrap_or(&[]))
    == digits.get(10).copied()
}

fn validate_hu_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "HU");
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  weighted_sum(&digits, &[9, 7, 3, 1, 9, 7, 3, 1]).is_multiple_of(10)
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

fn validate_ie_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "IE")
    .to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  if !matches!(chars.len(), 8 | 9) {
    return false;
  }
  if chars
    .get(..7)
    .unwrap_or(&[])
    .iter()
    .all(char::is_ascii_digit)
    && chars.get(7).is_some_and(char::is_ascii_uppercase)
  {
    if chars.len() == 9
      && !chars
        .get(8)
        .is_some_and(|ch| ch.is_ascii_uppercase() || matches!(ch, '+' | '*'))
    {
      return false;
    }
    return check_ie_vat_new(&chars);
  }
  if chars.len() == 8
    && chars.first().is_some_and(char::is_ascii_digit)
    && chars
      .get(1)
      .is_some_and(|ch| ch.is_ascii_uppercase() || matches!(ch, '+' | '*'))
    && chars
      .get(2..7)
      .unwrap_or(&[])
      .iter()
      .all(char::is_ascii_digit)
    && chars.get(7).is_some_and(char::is_ascii_uppercase)
  {
    return check_ie_vat_old(&chars);
  }
  false
}

fn check_ie_vat_new(chars: &[char]) -> bool {
  let trailing = if chars.len() == 9 {
    chars.get(8).copied().unwrap_or('W')
  } else {
    'W'
  };
  let Some(trailing_index) = IE_PPS_ALPHABET.find(trailing) else {
    return false;
  };
  let Ok(trailing_index) = u32::try_from(trailing_index) else {
    return false;
  };
  let mut sum = trailing_index.saturating_mul(9);
  for (index, ch) in chars.iter().take(7).enumerate() {
    let Ok(index) = u32::try_from(index) else {
      return false;
    };
    sum = sum.saturating_add(
      ascii_digit_value(*ch)
        .unwrap_or_default()
        .saturating_mul(8_u32.saturating_sub(index)),
    );
  }
  char_at(IE_PPS_ALPHABET, sum.rem_euclid(23)) == chars.get(7).copied()
}

fn check_ie_vat_old(chars: &[char]) -> bool {
  let mut rearranged = Vec::with_capacity(7);
  rearranged.push('0');
  rearranged.extend(chars.iter().skip(2).take(5).copied());
  if let Some(first) = chars.first().copied() {
    rearranged.push(first);
  }
  let mut sum = 0_u32;
  for (index, ch) in rearranged.iter().enumerate() {
    let Ok(index) = u32::try_from(index) else {
      return false;
    };
    sum = sum.saturating_add(
      ascii_digit_value(*ch)
        .unwrap_or_default()
        .saturating_mul(8_u32.saturating_sub(index)),
    );
  }
  char_at(IE_PPS_ALPHABET, sum.rem_euclid(23)) == chars.get(7).copied()
}

fn validate_it_codice_fiscale(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']).to_uppercase();
  if compact.len() == 11 && is_ascii_digits(&compact) {
    return validate_it_iva(&compact);
  }
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 16]>::try_from(chars) else {
    return false;
  };
  if !it_codice_fiscale_shape(&chars) {
    return false;
  }
  let mut sum = 0_u32;
  for (index, ch) in chars.iter().take(15).enumerate() {
    let Some(cf_value) = (if index.is_multiple_of(2) {
      it_cf_odd_value(*ch)
    } else {
      it_cf_even_value(*ch)
    }) else {
      return false;
    };
    sum = sum.saturating_add(cf_value);
  }
  char_at(IT_CODICE_FISCALE_CHECK_LETTERS, sum.rem_euclid(26))
    == chars.get(15).copied()
}

fn it_codice_fiscale_shape(chars: &[char; 16]) -> bool {
  chars.iter().take(6).all(char::is_ascii_uppercase)
    && chars
      .get(6..8)
      .unwrap_or(&[])
      .iter()
      .all(|ch| is_digit_or_omocodia(*ch))
    && chars.get(8).is_some_and(|ch| "ABCDEHLMPRST".contains(*ch))
    && chars
      .get(9..11)
      .unwrap_or(&[])
      .iter()
      .all(|ch| is_digit_or_omocodia(*ch))
    && chars.get(11).is_some_and(char::is_ascii_uppercase)
    && chars
      .get(12..15)
      .unwrap_or(&[])
      .iter()
      .all(|ch| is_digit_or_omocodia(*ch))
    && chars.get(15).is_some_and(char::is_ascii_uppercase)
}

const fn is_digit_or_omocodia(ch: char) -> bool {
  ch.is_ascii_digit()
    || matches!(
      ch,
      'L' | 'M' | 'N' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V'
    )
}

const fn it_cf_odd_value(ch: char) -> Option<u32> {
  Some(match ch {
    '0' | 'A' => 1,
    '1' | 'B' => 0,
    '2' | 'C' => 5,
    '3' | 'D' => 7,
    '4' | 'E' => 9,
    '5' | 'F' => 13,
    '6' | 'G' => 15,
    '7' | 'H' => 17,
    '8' | 'I' => 19,
    '9' | 'J' => 21,
    'K' => 2,
    'L' => 4,
    'M' => 18,
    'N' => 20,
    'O' => 11,
    'P' => 3,
    'Q' => 6,
    'R' => 8,
    'S' => 12,
    'T' => 14,
    'U' => 16,
    'V' => 10,
    'W' => 22,
    'X' => 25,
    'Y' => 24,
    'Z' => 23,
    _ => return None,
  })
}

fn it_cf_even_value(ch: char) -> Option<u32> {
  if ch.is_ascii_digit() {
    return ascii_digit_value(ch);
  }
  ch.is_ascii_uppercase()
    .then(|| u32::from(ch).saturating_sub(u32::from('A')))
}

fn validate_it_iva(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-'], "IT");
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  if digits.iter().take(7).all(|digit| *digit == 0) {
    return false;
  }
  let Some(province) = number_from_digits(digits.get(7..10)) else {
    return false;
  };
  ((1..=100).contains(&province) || matches!(province, 120 | 121 | 888 | 999))
    && luhn_checksum(&digits).is_multiple_of(10)
}

fn validate_lt_asmens(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let Some(gender_century) = digits.first().copied() else {
    return false;
  };
  if !(1..=9).contains(&gender_century) {
    return false;
  }
  if gender_century != 9 {
    let century: u32 = match gender_century {
      1 | 2 => 1800,
      3 | 4 => 1900,
      5 | 6 => 2000,
      7 | 8 => 2100,
      _ => return false,
    };
    let Some(yy) = two_digit_number(&digits, 1) else {
      return false;
    };
    let Some(month) = two_digit_number(&digits, 3) else {
      return false;
    };
    let Some(day) = two_digit_number(&digits, 5) else {
      return false;
    };
    if !valid_date(century.saturating_add(yy), month, day) {
      return false;
    }
  }
  two_pass_personal_check(digits.get(..10).unwrap_or(&[]))
    == digits.get(10).copied()
}

fn validate_lt_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "LT");
  let digits = decimal_digits_strict(&compact);
  if !matches!(digits.len(), 9 | 12) {
    return false;
  }
  if digits.len() == 9 && digits.get(7) != Some(&1) {
    return false;
  }
  if digits.len() == 12 && digits.get(10) != Some(&1) {
    return false;
  }
  lt_vat_checksum(&digits)
}

fn lt_vat_checksum(digits: &[u32]) -> bool {
  let len = digits.len();
  let mut check = 0_u32;
  for (index, digit) in digits.iter().take(len.saturating_sub(1)).enumerate() {
    let Ok(index) = u32::try_from(index) else {
      return false;
    };
    check = check.saturating_add(
      (1_u32.saturating_add(index.rem_euclid(9))).saturating_mul(*digit),
    );
  }
  check = check.rem_euclid(11);
  if check == 10 {
    check = 0;
    for (index, digit) in digits.iter().take(len.saturating_sub(1)).enumerate()
    {
      let Ok(index) = u32::try_from(index) else {
        return false;
      };
      check = check.saturating_add(
        (1_u32.saturating_add((index.saturating_add(2)).rem_euclid(9)))
          .saturating_mul(*digit),
      );
    }
    check = check.rem_euclid(11);
  }
  check.rem_euclid(10)
    == digits
      .get(len.saturating_sub(1))
      .copied()
      .unwrap_or(u32::MAX)
}

fn validate_lu_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "LU");
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  let Some(front) = number_from_digits(digits.get(..6)) else {
    return false;
  };
  let Some(check) = number_from_digits(digits.get(6..8)) else {
    return false;
  };
  front.rem_euclid(89) == check
}

fn validate_lv_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "LV");
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  if digits.first() == Some(&3)
    && digits.get(1).is_some_and(|digit| (2..=9).contains(digit))
  {
    return true;
  }
  match digits.first().copied() {
    Some(4 | 5 | 9) => {
      weighted_sum(&digits, &[9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1]).rem_euclid(11)
        == 3
    }
    _ => validate_lv_personal_vat(&digits),
  }
}

fn validate_lv_personal_vat(digits: &[u32; 11]) -> bool {
  let Some(day) = two_digit_number(digits, 0) else {
    return false;
  };
  let Some(month) = two_digit_number(digits, 2) else {
    return false;
  };
  let Some(year2) = two_digit_number(digits, 4) else {
    return false;
  };
  let Some(century_digit) = digits.get(6).copied() else {
    return false;
  };
  if century_digit > 2 {
    return false;
  }
  let full_year = 1800_u32
    .saturating_add(century_digit.saturating_mul(100))
    .saturating_add(year2);
  if !valid_date(full_year, month, day) {
    return false;
  }
  let mut sum = 1_u32;
  for (digit, weight) in
    digits.iter().take(10).zip([10, 5, 8, 4, 2, 1, 6, 3, 7, 9])
  {
    sum = sum.saturating_add(digit.saturating_mul(weight));
  }
  sum.rem_euclid(11).rem_euclid(10)
    == digits.get(10).copied().unwrap_or(u32::MAX)
}

fn validate_mt_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "MT");
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  digits.first() != Some(&0)
    && weighted_sum(&digits, &[3, 4, 6, 7, 8, 9, 10, 1]).is_multiple_of(37)
}

fn validate_nl_vat(value: &str) -> bool {
  let mut compact =
    strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "NL")
      .to_uppercase();
  if let Some(index) = compact.find('B')
    && index > 0
    && index < 9
  {
    let numeric = compact.get(..index).unwrap_or_default();
    let suffix = compact.get(index..).unwrap_or_default();
    compact = format!("{numeric:0>9}{suffix}");
  }
  compact.len() == 12
    && compact.get(..9).is_some_and(is_ascii_digits)
    && compact.chars().nth(9) == Some('B')
    && compact.get(10..12).is_some_and(is_ascii_digits)
}

fn validate_pl_nip(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-'], "PL");
  let Ok(digits) = <[u32; 10]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let check =
    weighted_sum(digits.get(..9).unwrap_or(&[]), &[6, 5, 7, 2, 3, 4, 5, 6, 7])
      .rem_euclid(11);
  check < 10 && digits.get(9).copied() == Some(check)
}

fn validate_pl_pesel(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 11]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let Some(yy) = two_digit_number(&digits, 0) else {
    return false;
  };
  let Some(raw_month) = two_digit_number(&digits, 2) else {
    return false;
  };
  let Some(day) = two_digit_number(&digits, 4) else {
    return false;
  };
  let Some((century, month)) = pesel_century_month(raw_month) else {
    return false;
  };
  if !valid_date(century.saturating_add(yy), month, day) {
    return false;
  }
  let check = 10_u32
    .saturating_sub(
      weighted_sum(
        digits.get(..10).unwrap_or(&[]),
        &[1, 3, 7, 9, 1, 3, 7, 9, 1, 3],
      )
      .rem_euclid(10),
    )
    .rem_euclid(10);
  digits.get(10).copied() == Some(check)
}

const fn pesel_century_month(raw_month: u32) -> Option<(u32, u32)> {
  match raw_month {
    81..=92 => Some((1800, raw_month.saturating_sub(80))),
    1..=12 => Some((1900, raw_month)),
    21..=32 => Some((2000, raw_month.saturating_sub(20))),
    41..=52 => Some((2100, raw_month.saturating_sub(40))),
    61..=72 => Some((2200, raw_month.saturating_sub(60))),
    _ => None,
  }
}

fn validate_pt_cc(value: &str) -> bool {
  let compact = compact_without(value, &[' ']).to_uppercase();
  let chars = compact.chars().collect::<Vec<_>>();
  let Ok(chars) = <[char; 12]>::try_from(chars) else {
    return false;
  };
  if !chars.iter().take(9).all(char::is_ascii_digit)
    || !chars
      .iter()
      .skip(9)
      .take(2)
      .all(char::is_ascii_alphanumeric)
    || !chars.get(11).is_some_and(char::is_ascii_digit)
  {
    return false;
  }
  pt_cc_check_digit(chars.get(..11).unwrap_or(&[])) == chars.get(11).copied()
}

fn pt_cc_check_digit(chars: &[char]) -> Option<char> {
  let mut sum = 0_u32;
  for (position, ch) in chars.iter().rev().enumerate() {
    let mut value = u32::try_from(PORTUGUESE_CC_ALPHABET.find(*ch)?).ok()?;
    if position.is_multiple_of(2) {
      value = value.saturating_mul(2);
      if value > 9 {
        value = value.div_euclid(10).saturating_add(value.rem_euclid(10));
      }
    }
    sum = sum.saturating_add(value);
  }
  char_at(
    "0123456789",
    10_u32.saturating_sub(sum.rem_euclid(10)).rem_euclid(10),
  )
}

fn validate_pt_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "PT");
  let Ok(digits) = <[u32; 9]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  if digits.first() == Some(&0) {
    return false;
  }
  let check = 11_u32
    .saturating_sub(
      weighted_sum(digits.get(..8).unwrap_or(&[]), &[9, 8, 7, 6, 5, 4, 3, 2])
        .rem_euclid(11),
    )
    .rem_euclid(11)
    .rem_euclid(10);
  digits.get(8).copied() == Some(check)
}

fn validate_ro_cnp(value: &str) -> bool {
  let compact = compact_without(value, &[' ', '-']);
  let Ok(digits) = <[u32; 13]>::try_from(decimal_digits_strict(&compact))
  else {
    return false;
  };
  let Some(gender_century) = digits.first().copied() else {
    return false;
  };
  let century: u32 = match gender_century {
    1 | 2 | 7 | 8 | 9 => 1900,
    3 | 4 => 1800,
    5 | 6 => 2000,
    _ => return false,
  };
  let Some(yy) = two_digit_number(&digits, 1) else {
    return false;
  };
  let Some(month) = two_digit_number(&digits, 3) else {
    return false;
  };
  let Some(day) = two_digit_number(&digits, 5) else {
    return false;
  };
  if !valid_date(century.saturating_add(yy), month, day) {
    return false;
  }
  let Some(county) = two_digit_number(&digits, 7) else {
    return false;
  };
  if !ROMANIAN_CNP_COUNTIES.contains(&county) {
    return false;
  }
  let sum = weighted_sum(
    digits.get(..12).unwrap_or(&[]),
    &[2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9],
  )
  .rem_euclid(11);
  let check = if sum == 10 { 1 } else { sum };
  digits.get(12).copied() == Some(check)
}

fn validate_ro_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "RO");
  let digits = decimal_digits_strict(&compact);
  if !(2..=10).contains(&digits.len()) || digits.first() == Some(&0) {
    return false;
  }
  let mut padded = vec![0_u32; 10_usize.saturating_sub(digits.len())];
  padded.extend(digits);
  let check =
    weighted_sum(padded.get(..9).unwrap_or(&[]), &[7, 5, 3, 2, 1, 7, 5, 3, 2])
      .rem_euclid(11)
      .saturating_mul(10)
      .rem_euclid(11)
      .rem_euclid(10);
  padded.get(9).copied() == Some(check)
}

fn validate_se_personnummer(value: &str) -> bool {
  let compact = compact_se_personnummer(value);
  if !matches!(compact.len(), 11 | 13) {
    return false;
  }
  let Some(separator) = compact.chars().nth(compact.len().saturating_sub(5))
  else {
    return false;
  };
  if !matches!(separator, '-' | '+') {
    return false;
  }
  let digits_text = format!(
    "{}{}",
    compact
      .get(..compact.len().saturating_sub(5))
      .unwrap_or_default(),
    compact
      .get(compact.len().saturating_sub(4)..)
      .unwrap_or_default()
  );
  if !is_ascii_digits(&digits_text) || !valid_se_birth_date(&compact) {
    return false;
  }
  let last_ten = digits_text
    .get(digits_text.len().saturating_sub(10)..)
    .unwrap_or_default();
  let digits = decimal_digits_strict(last_ten);
  luhn_checksum(&digits).is_multiple_of(10)
}

fn compact_se_personnummer(value: &str) -> String {
  let compact = compact_without(value, &[' ', ':']);
  // Work on characters, not bytes: multibyte input would otherwise make the
  // byte-offset insert/slice land mid-codepoint and panic. Non-ASCII input is
  // rejected downstream by `is_ascii_digits`, so preserving it verbatim here is
  // fine as long as we never break a codepoint.
  let mut chars: Vec<char> = compact.chars().collect();
  // A bare 10- or 12-character number gets the '-' century/serial separator
  // inserted before the last four characters (matching src/se/personnummer.ts).
  if matches!(chars.len(), 10 | 12) {
    let insertion = chars.len().saturating_sub(4);
    chars.insert(insertion, '-');
  }
  if chars.len() < 5 {
    return chars.into_iter().collect();
  }
  let split = chars.len().saturating_sub(5);
  // Drop separators from the head; keep the trailing five characters intact.
  chars
    .iter()
    .take(split)
    .filter(|ch| !matches!(ch, '-' | '+'))
    .chain(chars.iter().skip(split))
    .collect()
}

fn valid_se_birth_date(value: &str) -> bool {
  let len = value.len();
  let separator = value.chars().nth(len.saturating_sub(5)).unwrap_or('-');
  let (year, month_start, day_start): (u32, usize, usize) = if len == 13 {
    let Some(year) = value.get(0..4).and_then(|text| text.parse::<u32>().ok())
    else {
      return false;
    };
    (year, 4, 6)
  } else {
    let current = current_year();
    let yy = value
      .get(0..2)
      .and_then(|text| text.parse::<u32>().ok())
      .unwrap_or(u32::MAX);
    let mut century = current.div_euclid(100);
    if yy > current.rem_euclid(100) {
      century = century.saturating_sub(1);
    }
    if separator == '+' {
      century = century.saturating_sub(1);
    }
    (century.saturating_mul(100).saturating_add(yy), 2, 4)
  };
  let Some(month) = value
    .get(month_start..month_start.saturating_add(2))
    .and_then(|text| text.parse::<u32>().ok())
  else {
    return false;
  };
  let Some(day) = value
    .get(day_start..day_start.saturating_add(2))
    .and_then(|text| text.parse::<u32>().ok())
  else {
    return false;
  };
  valid_date(year, month, day)
}

fn validate_si_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "SI");
  let Ok(digits) = <[u32; 8]>::try_from(decimal_digits_strict(&compact)) else {
    return false;
  };
  if digits.first() == Some(&0) {
    return false;
  }
  let check = 11_u32.saturating_sub(
    weighted_sum(digits.get(..7).unwrap_or(&[]), &[8, 7, 6, 5, 4, 3, 2])
      .rem_euclid(11),
  );
  if check == 11 {
    return false;
  }
  let expected = if check == 10 { 0 } else { check };
  digits.get(7).copied() == Some(expected)
}

fn validate_sk_dic(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-'], "SK");
  let digits = decimal_digits_strict(&compact);
  if digits.len() != 10 {
    return false;
  }
  if validate_cz_rc(&compact) {
    return true;
  }
  if digits.first() == Some(&0) {
    return false;
  }
  if !matches!(digits.get(2), Some(2 | 3 | 4 | 7 | 8 | 9)) {
    return false;
  }
  // A 10-digit value can reach 9_999_999_999, which overflows u32; fold into a
  // u64 so numbers above u32::MAX (e.g. 4320000003) reach the modulo check and
  // stay in parity with the TS validator.
  digits
    .iter()
    .try_fold(0_u64, |total, &digit| {
      total.checked_mul(10)?.checked_add(u64::from(digit))
    })
    .is_some_and(|number| number.is_multiple_of(11))
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

fn validate_es_vat(value: &str) -> bool {
  let compact = strip_prefix_after_compact(value, &[' ', '-', '/', '.'], "ES")
    .to_uppercase();
  if compact.len() != 9 {
    return false;
  }
  if compact.get(..8).is_some_and(is_ascii_digits) {
    return validate_es_dni(&compact);
  }
  let Some(first) = compact.chars().next() else {
    return false;
  };
  if matches!(first, 'X' | 'Y' | 'Z') {
    return validate_es_nie(&compact);
  }
  if matches!(first, 'K' | 'L' | 'M') {
    let Some(digits) = compact.get(1..8) else {
      return false;
    };
    if !is_ascii_digits(digits) {
      return false;
    }
    let Some(number) = digits.parse::<u32>().ok() else {
      return false;
    };
    return compact.chars().nth(8) == spanish_check_letter(number);
  }
  if "ABCDEFGHJNPQRSUVW".contains(first) {
    return validate_es_cif(&compact);
  }
  false
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

fn strip_prefix_after_compact(
  value: &str,
  skipped: &[char],
  prefix: &str,
) -> String {
  let compact = compact_without(value, skipped);
  if starts_with_ignore_ascii_case(&compact, prefix) {
    return compact.chars().skip(prefix.chars().count()).collect();
  }
  compact
}

fn starts_with_ignore_ascii_case(value: &str, prefix: &str) -> bool {
  value
    .get(..prefix.len())
    .is_some_and(|head| head.eq_ignore_ascii_case(prefix))
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

fn two_digit_number(digits: &[u32], start: usize) -> Option<u32> {
  Some(
    digits
      .get(start)?
      .saturating_mul(10)
      .saturating_add(*digits.get(start.saturating_add(1))?),
  )
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

fn two_pass_personal_check(digits: &[u32]) -> Option<u32> {
  if digits.len() != 10 {
    return None;
  }
  let mut remainder =
    weighted_sum(digits, &[1, 2, 3, 4, 5, 6, 7, 8, 9, 1]).rem_euclid(11);
  if remainder != 10 {
    return Some(remainder);
  }
  remainder =
    weighted_sum(digits, &[3, 4, 5, 6, 7, 8, 9, 1, 2, 3]).rem_euclid(11);
  Some(if remainder == 10 { 0 } else { remainder })
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

fn resolve_two_digit_year(year: u32) -> u32 {
  let candidate = 2000_u32.saturating_add(year);
  if candidate > current_year() {
    candidate.saturating_sub(100)
  } else {
    candidate
  }
}

fn current_year() -> u32 {
  current_date().0
}

fn current_date() -> (u32, u32, u32) {
  let Ok(duration) = SystemTime::now().duration_since(UNIX_EPOCH) else {
    return (1970, 1, 1);
  };
  let days = i64::try_from(duration.as_secs().div_euclid(86_400)).unwrap_or(0);
  let (year, month, day) = civil_from_days(days);
  (u32::try_from(year).unwrap_or(1970), month, day)
}

fn civil_from_days(days_since_epoch: i64) -> (i32, u32, u32) {
  let z = days_since_epoch.saturating_add(719_468);
  let era =
    if z >= 0 { z } else { z.saturating_sub(146_096) }.div_euclid(146_097);
  let day_of_era = z.saturating_sub(era.saturating_mul(146_097));
  let year_of_era = (day_of_era
    .saturating_sub(day_of_era.div_euclid(1460))
    .saturating_add(day_of_era.div_euclid(36_524))
    .saturating_sub(day_of_era.div_euclid(146_096)))
  .div_euclid(365);
  let mut year = year_of_era.saturating_add(era.saturating_mul(400));
  let day_of_year = day_of_era
    .saturating_sub(365_i64.saturating_mul(year_of_era))
    .saturating_sub(year_of_era.div_euclid(4))
    .saturating_add(year_of_era.div_euclid(100));
  let month_piece =
    (5_i64.saturating_mul(day_of_year).saturating_add(2)).div_euclid(153);
  let day = day_of_year
    .saturating_sub(
      (153_i64.saturating_mul(month_piece).saturating_add(2)).div_euclid(5),
    )
    .saturating_add(1);
  let month = month_piece.saturating_add(if month_piece < 10 { 3 } else { -9 });
  if month <= 2 {
    year = year.saturating_add(1);
  }
  (
    i32::try_from(year).unwrap_or(1970),
    u32::try_from(month).unwrap_or(1),
    u32::try_from(day).unwrap_or(1),
  )
}

fn sha256(bytes: &[u8]) -> Vec<u8> {
  use sha2::Digest;

  sha2::Sha256::digest(bytes).to_vec()
}

fn keccak256_hex(bytes: &[u8]) -> String {
  use std::fmt::Write as _;

  use sha3::Digest;

  let digest = sha3::Keccak256::digest(bytes);
  let mut result = String::with_capacity(digest.len().saturating_mul(2));
  for byte in digest {
    let _ = write!(result, "{byte:02x}");
  }
  result
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
    assert!(supported_validator_ids().contains(&"crypto.wallet"));
    assert!(supported_validator_ids().contains(&"cz.rc"));
    assert!(supported_validator_ids().contains(&"de.idnr"));
    assert!(supported_validator_ids().contains(&"fi.ytunnus"));
    assert!(supported_validator_ids().contains(&"it.codiceFiscale"));
    assert!(supported_validator_ids().contains(&"se.personnummer"));
    assert!(supported_validator_ids().contains(&"us.rtn"));
  }

  #[test]
  fn validates_known_good_values() {
    let cases = [
      ("au.abn", "51 824 753 556"),
      ("au.abn", "00000000019"),
      ("au.acn", "004 085 616"),
      ("at.businessid", "FN 122119m"),
      ("at.tin", "59-119901/3"),
      ("at.uid", "ATU13585627"),
      ("be.nn", "93051822361"),
      ("be.vat", "BE0776091951"),
      ("bg.vat", "BG175074752"),
      ("br.cnpj", "33.000.167/0001-01"),
      ("br.cnpj", "12ABC34501DE35"),
      ("br.cpf", "390.533.447-05"),
      ("ch.uid", "CHE-100.155.212"),
      ("cn.ric", "11010519491231002X"),
      (
        "crypto.wallet",
        "0xde709f2102306220921060314715629080e2fb77",
      ),
      ("crypto.wallet", "1BoatSLRHtKNngkdXEeobR76b53LETtpyT"),
      (
        "crypto.wallet",
        "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      ),
      ("cy.vat", "CY10259033P"),
      ("cz.dic", "CZ25123891"),
      ("cz.dic", "CZ600000008"),
      ("cz.rc", "710319/2745"),
      ("de.idnr", "36 574 261 809"),
      ("de.stnr", "2181508150"),
      ("de.svnr", "12010188M011"),
      ("de.vat", "DE136695976"),
      ("dk.cpr", "211062-5629"),
      ("dk.vat", "DK13585628"),
      ("ee.ik", "36805280109"),
      ("ee.vat", "EE100931558"),
      ("es.cif", "A13585625"),
      ("es.dni", "54362315K"),
      ("es.dni", "1234567L"),
      ("es.nie", "X5253868R"),
      ("es.nss", "28/12345678/40"),
      // Province 43-52 with an 8-digit affiliate: base exceeds u32::MAX.
      ("es.nss", "493961665403"),
      ("es.vat", "ES12345678Z"),
      ("es.vat", "ESA78304516"),
      ("fi.hetu", "131052-308T"),
      ("fi.vat", "FI20774740"),
      ("fi.ytunnus", "2077474-0"),
      ("fr.nir", "295117823456784"),
      ("fr.siren", "552 008 443"),
      ("fr.siret", "73282932000074"),
      ("fr.tva", "FR40303265045"),
      ("fr.tva", "FRK7399859412"),
      ("gb.nhs", "401 023 2137"),
      ("gb.nino", "AB 12 34 56 C"),
      ("gb.vat", "GB980780684"),
      ("gb.vat", "GD499"),
      ("gb.vat", "HA500"),
      ("gr.vat", "EL094259216"),
      ("hr.vat", "HR33392005961"),
      ("hu.vat", "HU12892312"),
      ("ie.pps", "6433435F"),
      ("ie.vat", "IE6433435F"),
      ("ie.vat", "IE8D79739I"),
      ("it.codiceFiscale", "RCCMNL83S18D969H"),
      ("it.iva", "IT00743110157"),
      ("lt.asmens", "33309240064"),
      ("lt.vat", "LT119511515"),
      ("lt.vat", "LT100001919017"),
      ("lu.vat", "LU15027442"),
      ("lv.vat", "LV40003521600"),
      ("lv.vat", "LV16117519997"),
      ("lv.vat", "LV32999999999"),
      ("mt.vat", "MT11679112"),
      ("nl.vat", "NL000099998B57"),
      ("no.mva", "NO995525828MVA"),
      ("no.orgnr", "988 077 917"),
      ("pl.nip", "PL8567346215"),
      ("pl.pesel", "44051401359"),
      ("pt.cc", "000000000 ZZ 8"),
      ("pt.vat", "PT501964843"),
      ("ro.cnp", "1630615123457"),
      ("ro.vat", "RO18547290"),
      ("se.personnummer", "8803200016"),
      ("si.vat", "SI15012557"),
      ("sk.dic", "SK2021853504"),
      // 10-digit value above u32::MAX that is still divisible by 11.
      ("sk.dic", "4320000003"),
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
      ("at.businessid", "122119"),
      ("at.tin", "59-119901/4"),
      ("at.uid", "ATU13585628"),
      ("be.nn", "93051822362"),
      ("be.vat", "BE0776091952"),
      ("bg.vat", "BG175074753"),
      ("br.cnpj", "33.000.167/0001-02"),
      ("br.cpf", "111.111.111-11"),
      ("ch.uid", "CHE100155213"),
      ("cn.ric", "110105194912310021"),
      ("crypto.wallet", "1BoatSLRHtKNngkdXEeobR76b53LETtpyU"),
      ("cy.vat", "CY10259033Q"),
      ("cz.dic", "CZ25123890"),
      ("cz.rc", "710319/2744"),
      ("de.idnr", "36 574 261 808"),
      ("de.stnr", "123"),
      ("de.svnr", "12010188M012"),
      ("de.vat", "DE136695977"),
      ("dk.cpr", "321399-5629"),
      // Serial head maps yy into the 2000s, resolving to 2057-12-31 (future).
      ("dk.cpr", "3112575000"),
      ("dk.vat", "DK13585629"),
      ("ee.ik", "36805280108"),
      ("ee.vat", "EE100931559"),
      ("es.cif", "A13585626"),
      ("es.dni", "54362315A"),
      ("es.nie", "X5253868A"),
      ("es.nss", "28/12345678/41"),
      ("es.vat", "ES12345678A"),
      ("fi.hetu", "131052-308A"),
      ("fi.vat", "FI20774741"),
      ("fi.ytunnus", "2077474-1"),
      ("fr.nir", "295117823456785"),
      ("fr.siren", "552 008 444"),
      ("fr.siret", "73282932000075"),
      ("fr.tva", "FR40303265046"),
      ("gb.nhs", "401 023 2138"),
      ("gb.nino", "GB 12 34 56 C"),
      ("gb.vat", "GB980780685"),
      ("gb.vat", "GD500"),
      ("gb.vat", "HA499"),
      ("gr.vat", "EL094259217"),
      ("hr.vat", "HR33392005962"),
      ("hu.vat", "HU12892313"),
      ("ie.pps", "6433435A"),
      ("ie.vat", "IE6433435A"),
      ("it.codiceFiscale", "RCCMNL83S18D967H"),
      ("it.iva", "IT00743110158"),
      ("lt.asmens", "33309240164"),
      ("lt.vat", "LT119511516"),
      ("lu.vat", "LU15027443"),
      ("lv.vat", "LV40003521601"),
      ("mt.vat", "MT11679113"),
      ("nl.vat", "NL000099998A57"),
      ("no.mva", "NO995525829MVA"),
      ("no.orgnr", "988 077 918"),
      ("pl.nip", "PL8567346216"),
      ("pl.pesel", "44051401358"),
      ("pt.cc", "000000000ZZ3"),
      ("pt.vat", "PT501964844"),
      ("ro.cnp", "1630615123458"),
      ("ro.vat", "RO18547291"),
      ("se.personnummer", "8803200018"),
      ("si.vat", "SI15012558"),
      ("sk.dic", "SK2021853505"),
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
    assert!(validate_id(
      "crypto.wallet",
      "BTC wallet: 1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
      Some("crypto-wallet-candidate")
    ));
  }

  #[test]
  fn rejects_unknown_validators() {
    assert!(!validate_named_id("unknown", "111000025"));
  }
}

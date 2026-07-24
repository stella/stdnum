use crate::{
  BTC_BASE58_DECODED_LENGTH, BTC_BASE58_MAX_LENGTH, BTC_BASE58_MIN_LENGTH,
  BTC_MAINNET_P2PKH_VERSION, BTC_MAINNET_P2SH_VERSION,
  btc_base58_checksum_valid, compact_without,
  decode_base58 as decode_base58_core,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "crypto.btcbase58",
  name: "Bitcoin Base58Check Address",
  local_name: "Bitcoin Base58Check Address",
  abbreviation: "BTC",
  aliases: &[
    "Bitcoin address",
    "Bitcoin legacy address",
    "Base58Check address",
  ],
  candidate_pattern: r"[13][1-9A-HJ-NP-Za-km-z]{25,34}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: None,
  lengths: &[],
  examples: &[
    "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  ],
  compact,
  format,
  validate,
  generate: None,
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' '])
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

#[must_use]
pub fn decode_base58(value: &str) -> Option<Vec<u8>> {
  decode_base58_core(value)
}

pub fn validate(value: &str) -> ValidationResult {
  let value = compact(value);
  if value.len() < BTC_BASE58_MIN_LENGTH || value.len() > BTC_BASE58_MAX_LENGTH
  {
    return Err(ValidationError::InvalidLength(
      "Bitcoin Base58Check address must be 26-35 characters",
    ));
  }
  if !value.starts_with(['1', '3']) {
    return Err(ValidationError::InvalidComponent(
      "Bitcoin Base58Check address must start with 1 or 3",
    ));
  }
  let Some(decoded) = decode_base58(&value) else {
    return Err(ValidationError::InvalidFormat(
      "Bitcoin Base58Check address contains invalid characters",
    ));
  };
  if decoded.len() != BTC_BASE58_DECODED_LENGTH {
    return Err(ValidationError::InvalidLength(
      "Bitcoin Base58Check address decoded payload must be 25 bytes",
    ));
  }
  let Some(version) = decoded.first().copied() else {
    return Err(ValidationError::InvalidLength(
      "Bitcoin Base58Check address decoded payload must be 25 bytes",
    ));
  };
  if version != BTC_MAINNET_P2PKH_VERSION && version != BTC_MAINNET_P2SH_VERSION
  {
    return Err(ValidationError::InvalidComponent(
      "Bitcoin Base58Check address has an unsupported version",
    ));
  }
  if !btc_base58_checksum_valid(&decoded) {
    return Err(ValidationError::InvalidChecksum(
      "Bitcoin Base58Check address fails checksum validation",
    ));
  }
  Ok(value)
}

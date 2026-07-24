use crate::{
  compact_without, eth_has_valid_eip55_checksum,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

const ADDRESS_LENGTH: usize = 42;

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "crypto.eth",
  name: "Ethereum Address",
  local_name: "Ethereum Address",
  abbreviation: "ETH",
  aliases: &["Ethereum address", "EVM address", "crypto wallet"],
  candidate_pattern: r"0x[0-9A-Fa-f]{40}",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: None,
  lengths: &[ADDRESS_LENGTH],
  examples: &["0xde709f2102306220921060314715629080e2fb77"],
  compact,
  format,
  validate,
  generate: None,
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ']).to_lowercase()
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

#[must_use]
pub fn has_valid_eip55_checksum(address: &str) -> bool {
  address.get(2..).is_some_and(eth_has_valid_eip55_checksum)
}

pub fn validate(value: &str) -> ValidationResult {
  let raw = compact_without(value, &[' ']);
  let compact = raw.to_lowercase();
  if compact.len() != ADDRESS_LENGTH {
    return Err(ValidationError::InvalidLength(
      "Ethereum address must be 42 characters",
    ));
  }
  let shape_valid = raw
    .get(..2)
    .is_some_and(|prefix| prefix.eq_ignore_ascii_case("0x"))
    && raw
      .get(2..)
      .is_some_and(|body| body.chars().all(|ch| ch.is_ascii_hexdigit()));
  if !shape_valid {
    return Err(ValidationError::InvalidFormat(
      "Ethereum address must be 0x followed by 40 hexadecimal characters",
    ));
  }
  if !has_valid_eip55_checksum(&raw) {
    return Err(ValidationError::InvalidChecksum(
      "Ethereum address fails EIP-55 checksum validation",
    ));
  }
  Ok(compact)
}

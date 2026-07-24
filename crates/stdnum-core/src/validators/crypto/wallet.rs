use crate::types::{
  EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
  ValidatorSpec,
};

use super::{btcbase58, btcbech32, eth};

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "crypto.wallet",
  name: "Cryptocurrency Wallet Address",
  local_name: "Cryptocurrency Wallet Address",
  abbreviation: "crypto",
  aliases: &["crypto address", "wallet address", "cryptocurrency wallet"],
  candidate_pattern: r"(?:0x[0-9A-Fa-f]{40}|[13][1-9A-HJ-NP-Za-km-z]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: None,
  lengths: &[],
  examples: &[
    "0xde709f2102306220921060314715629080e2fb77",
    "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  ],
  compact,
  format,
  validate,
  generate: None,
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  for validate in [eth::validate, btcbech32::validate, btcbase58::validate] {
    if let Ok(compact) = validate(value) {
      return compact;
    }
  }
  value.trim().to_owned()
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

pub fn validate(value: &str) -> ValidationResult {
  for validate in [eth::validate, btcbech32::validate, btcbase58::validate] {
    if let Ok(compact) = validate(value) {
      return Ok(compact);
    }
  }
  Err(ValidationError::InvalidFormat(
    "Unsupported cryptocurrency wallet address",
  ))
}

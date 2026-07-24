#![allow(clippy::needless_pass_by_value)]

use napi::{Error, Result, Status, bindgen_prelude::Uint8Array};
use napi_derive::napi;
use stella_stdnum_core::{
  EntityType, Gender, ParsedIdentifier, ValidationError, Validator,
  ValidatorScope,
};

/// A validation error returned as data rather than thrown into JavaScript.
#[napi(object)]
pub struct JsValidationError {
  pub code: String,
  pub message: String,
}

/// The stable validation result shared by native and WebAssembly bindings.
#[napi(object)]
pub struct JsValidationResult {
  pub valid: bool,
  pub compact: Option<String>,
  pub error: Option<JsValidationError>,
}

/// Structured data encoded by a personal identifier.
#[napi(object)]
pub struct JsParsedIdentifier {
  pub birth_year: i32,
  pub birth_month: u32,
  pub birth_day: u32,
  pub gender: Option<String>,
}

/// Result from the lower-level Bitcoin Bech32 parser.
#[napi(object)]
pub struct JsBech32Validation {
  pub valid: bool,
  pub code: Option<String>,
}

/// Serializable metadata for a validator in the Rust registry.
#[napi(object)]
pub struct JsValidatorMetadata {
  pub id: String,
  pub name: String,
  pub local_name: String,
  pub abbreviation: String,
  pub description: Option<String>,
  pub aliases: Vec<String>,
  pub candidate_pattern: String,
  pub scope: String,
  pub country: Option<String>,
  pub entity_type: String,
  pub source_url: Option<String>,
  pub lengths: Vec<u32>,
  pub examples: Vec<String>,
  pub can_generate: bool,
  pub can_parse: bool,
}

fn unknown_validator(id: &str) -> Error {
  Error::new(Status::InvalidArg, format!("unknown validator id: {id}"))
}

fn find_validator(id: &str) -> Result<&'static Validator> {
  stella_stdnum_core::validator(id).ok_or_else(|| unknown_validator(id))
}

fn validation_error(error: ValidationError) -> JsValidationResult {
  JsValidationResult {
    valid: false,
    compact: None,
    error: Some(JsValidationError {
      code: error.code().as_str().to_owned(),
      message: error.message().to_owned(),
    }),
  }
}

fn metadata(validator: &Validator) -> JsValidatorMetadata {
  let (scope, country) = match validator.scope() {
    ValidatorScope::Country(country) => {
      ("country".to_owned(), Some(country.as_str().to_owned()))
    }
    ValidatorScope::Global => ("global".to_owned(), None),
  };
  let entity_type = match validator.entity_type() {
    EntityType::Person => "person",
    EntityType::Company => "company",
    EntityType::Any => "any",
  };

  JsValidatorMetadata {
    id: validator.id().to_owned(),
    name: validator.name().to_owned(),
    local_name: validator.local_name().to_owned(),
    abbreviation: validator.abbreviation().to_owned(),
    description: validator.description().map(ToString::to_string),
    aliases: validator
      .aliases()
      .iter()
      .map(ToString::to_string)
      .collect(),
    candidate_pattern: validator.candidate_pattern().to_owned(),
    scope,
    country,
    entity_type: entity_type.to_owned(),
    source_url: validator.source_url().map(ToString::to_string),
    lengths: validator
      .lengths()
      .iter()
      .filter_map(|length| u32::try_from(*length).ok())
      .collect(),
    examples: validator
      .examples()
      .iter()
      .map(ToString::to_string)
      .collect(),
    can_generate: validator.can_generate(),
    can_parse: validator.can_parse(),
  }
}

fn parsed_identifier(parsed: ParsedIdentifier) -> JsParsedIdentifier {
  JsParsedIdentifier {
    birth_year: parsed.birth_date.year,
    birth_month: u32::from(parsed.birth_date.month),
    birth_day: u32::from(parsed.birth_date.day),
    gender: parsed.gender.map(|gender| match gender {
      Gender::Male => "male".to_owned(),
      Gender::Female => "female".to_owned(),
    }),
  }
}

#[napi(js_name = "validatorIds")]
#[must_use]
pub fn validator_ids() -> Vec<String> {
  stella_stdnum_core::validators()
    .iter()
    .map(|validator| validator.id().to_owned())
    .collect()
}

#[napi(js_name = "validators")]
#[must_use]
pub fn validators() -> Vec<JsValidatorMetadata> {
  stella_stdnum_core::validators()
    .iter()
    .map(|validator| metadata(validator))
    .collect()
}

#[napi(js_name = "validatorMetadata")]
pub fn validator_metadata(id: String) -> Result<JsValidatorMetadata> {
  find_validator(&id).map(metadata)
}

#[napi(js_name = "validate")]
pub fn validate(id: String, value: String) -> Result<JsValidationResult> {
  let validator = find_validator(&id)?;
  Ok(match validator.validate(&value) {
    Ok(compact) => JsValidationResult {
      valid: true,
      compact: Some(compact),
      error: None,
    },
    Err(error) => validation_error(error),
  })
}

#[napi(js_name = "compact")]
pub fn compact(id: String, value: String) -> Result<String> {
  find_validator(&id).map(|validator| validator.compact(&value))
}

#[napi(js_name = "format")]
pub fn format(id: String, value: String) -> Result<String> {
  find_validator(&id).map(|validator| validator.format(&value))
}

#[napi(js_name = "generate")]
pub fn generate(id: String) -> Result<Option<String>> {
  find_validator(&id).map(Validator::generate)
}

#[napi(js_name = "parse")]
pub fn parse(id: String, value: String) -> Result<Option<JsParsedIdentifier>> {
  find_validator(&id)
    .map(|validator| validator.parse(&value).map(parsed_identifier))
}

#[napi(js_name = "detectNetwork")]
#[must_use]
pub fn credit_card_detect_network(value: String) -> Option<String> {
  stella_stdnum_core::validators::global::creditcard::detect_network(&value)
    .map(|network| network.as_str().to_owned())
}

#[napi(js_name = "hasValidEip55Checksum")]
#[must_use]
pub fn eth_has_valid_eip55_checksum(value: String) -> bool {
  stella_stdnum_core::validators::crypto::eth::has_valid_eip55_checksum(&value)
}

#[napi(js_name = "decodeBase58")]
#[must_use]
pub fn btc_base58_decode(value: String) -> Option<Uint8Array> {
  stella_stdnum_core::validators::crypto::btcbase58::decode_base58(&value)
    .map(Uint8Array::from)
}

#[napi(js_name = "polymod")]
#[must_use]
pub fn btc_bech32_polymod(values: Vec<u32>) -> u32 {
  stella_stdnum_core::validators::crypto::btcbech32::polymod(&values)
}

#[napi(js_name = "convertBits")]
#[must_use]
pub fn btc_bech32_convert_bits(
  values: Vec<u32>,
  from_bits: u32,
  to_bits: u32,
) -> Option<Vec<u32>> {
  stella_stdnum_core::validators::crypto::btcbech32::convert_bits(
    &values, from_bits, to_bits,
  )
}

#[napi(js_name = "validateBech32")]
#[must_use]
pub fn btc_bech32_validate(value: String) -> JsBech32Validation {
  use stella_stdnum_core::validators::crypto::btcbech32::Bech32ErrorCode;

  match stella_stdnum_core::validators::crypto::btcbech32::validate_bech32(
    &value,
  ) {
    Ok(()) => JsBech32Validation {
      valid: true,
      code: None,
    },
    Err(error) => JsBech32Validation {
      valid: false,
      code: Some(
        match error {
          Bech32ErrorCode::Format => "format",
          Bech32ErrorCode::Checksum => "checksum",
          Bech32ErrorCode::Component => "component",
        }
        .to_owned(),
      ),
    },
  }
}

#[napi(js_name = "beNnChecksum")]
#[must_use]
pub fn be_nn_checksum(value: String) -> Option<i32> {
  stella_stdnum_core::validators::be::nn::checksum(&value)
}

#[napi(js_name = "esVatCifChecksum")]
#[must_use]
pub fn es_vat_cif_checksum(value: String) -> Option<u32> {
  stella_stdnum_core::validators::es::vat::cif_checksum(&value)
}

#[napi(js_name = "eeIkTwoPassCheck")]
#[must_use]
pub fn ee_ik_two_pass_check(value: String) -> Option<u32> {
  stella_stdnum_core::validators::ee::ik::two_pass_check(&value)
}

#[napi(js_name = "gbNhsCalcCheckDigit")]
#[must_use]
pub fn gb_nhs_calc_check_digit(value: String) -> Option<u32> {
  stella_stdnum_core::validators::gb::nhs::calc_check_digit(&value)
}

#[napi(js_name = "gbSedolCalcCheckDigit")]
#[must_use]
pub fn gb_sedol_calc_check_digit(value: String) -> Option<u32> {
  stella_stdnum_core::validators::gb::sedol::calc_check_digit(&value)
}

#[napi(js_name = "luhnGenerate")]
#[must_use]
pub fn luhn_generate(length: Option<u32>) -> String {
  let length = length
    .and_then(|value| usize::try_from(value).ok())
    .unwrap_or(16);
  stella_stdnum_core::validators::global::luhn::generate(length)
}

/// Compatibility entry point for callers using the pre-registry boolean API.
#[napi(js_name = "validateId")]
#[must_use]
pub fn validate_id(
  validator: String,
  value: String,
  input: Option<String>,
) -> bool {
  stella_stdnum_core::validate_id(&validator, &value, input.as_deref())
}

/// Compatibility entry point for callers using the pre-registry boolean API.
#[napi(js_name = "validateNamedId")]
#[must_use]
pub fn validate_named_id(validator: String, value: String) -> bool {
  stella_stdnum_core::validate_named_id(&validator, &value)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn validation_errors_are_returned_as_typed_data() -> Result<()> {
    let result = validate("au.abn".to_owned(), "not-an-abn".to_owned())?;
    assert!(!result.valid);
    assert!(result.compact.is_none());
    assert_eq!(
      result.error.map(|error| error.code),
      Some("INVALID_FORMAT".to_owned())
    );
    Ok(())
  }

  #[test]
  fn metadata_preserves_scope_and_capabilities() -> Result<()> {
    let result = validator_metadata("at.businessid".to_owned())?;
    assert_eq!(result.country.as_deref(), Some("AT"));
    assert_eq!(result.scope, "country");
    assert!(result.can_generate);
    assert!(!result.can_parse);
    Ok(())
  }

  #[test]
  fn named_helpers_delegate_to_core() {
    assert_eq!(be_nn_checksum("85073003328".to_owned()), Some(1900));
    assert_eq!(es_vat_cif_checksum("0801934".to_owned()), Some(1));
    assert_eq!(ee_ik_two_pass_check("3760503029".to_owned()), Some(9));
    assert_eq!(gb_nhs_calc_check_digit("9434765919".to_owned()), Some(9));
    assert_eq!(gb_sedol_calc_check_digit("026349".to_owned()), Some(4));
    assert_eq!(luhn_generate(Some(8)).len(), 8);
  }
}

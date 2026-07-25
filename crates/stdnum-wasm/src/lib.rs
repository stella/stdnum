use serde::Serialize;
use stella_stdnum_core::{
  EntityType, Gender, ParsedIdentifier, ValidationError, Validator,
  ValidatorScope,
};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmValidationError {
  code: &'static str,
  message: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmValidationResult {
  valid: bool,
  compact: Option<String>,
  error: Option<WasmValidationError>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmParsedIdentifier {
  birth_year: i32,
  birth_month: u8,
  birth_day: u8,
  gender: Option<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmBech32Validation {
  valid: bool,
  code: Option<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmValidatorMetadata {
  id: &'static str,
  name: &'static str,
  local_name: &'static str,
  abbreviation: &'static str,
  description: Option<&'static str>,
  aliases: &'static [&'static str],
  candidate_pattern: &'static str,
  scope: &'static str,
  country: Option<&'static str>,
  entity_type: &'static str,
  source_url: Option<&'static str>,
  lengths: &'static [usize],
  examples: &'static [&'static str],
  can_generate: bool,
  can_parse: bool,
}

fn unknown_validator(id: &str) -> JsValue {
  JsValue::from_str(&format!("unknown validator id: {id}"))
}

fn find_validator(id: &str) -> Result<&'static Validator, JsValue> {
  stella_stdnum_core::validator(id).ok_or_else(|| unknown_validator(id))
}

fn serialize<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
  serde_wasm_bindgen::to_value(value)
    .map_err(|error| JsValue::from_str(&error.to_string()))
}

fn metadata(validator: &'static Validator) -> WasmValidatorMetadata {
  let (scope, country) = match validator.scope() {
    ValidatorScope::Country(country) => ("country", Some(country.as_str())),
    ValidatorScope::Global => ("global", None),
  };
  let entity_type = match validator.entity_type() {
    EntityType::Person => "person",
    EntityType::Company => "company",
    EntityType::Any => "any",
  };

  WasmValidatorMetadata {
    id: validator.id(),
    name: validator.name(),
    local_name: validator.local_name(),
    abbreviation: validator.abbreviation(),
    description: validator.description(),
    aliases: validator.aliases(),
    candidate_pattern: validator.candidate_pattern(),
    scope,
    country,
    entity_type,
    source_url: validator.source_url(),
    lengths: validator.lengths(),
    examples: validator.examples(),
    can_generate: validator.can_generate(),
    can_parse: validator.can_parse(),
  }
}

fn parsed_identifier(parsed: ParsedIdentifier) -> WasmParsedIdentifier {
  WasmParsedIdentifier {
    birth_year: parsed.birth_date.year,
    birth_month: parsed.birth_date.month,
    birth_day: parsed.birth_date.day,
    gender: parsed.gender.map(|gender| match gender {
      Gender::Male => "male",
      Gender::Female => "female",
    }),
  }
}

const fn validation_error(error: &ValidationError) -> WasmValidationResult {
  WasmValidationResult {
    valid: false,
    compact: None,
    error: Some(WasmValidationError {
      code: error.code().as_str(),
      message: error.message(),
    }),
  }
}

#[wasm_bindgen(js_name = validatorIds)]
pub fn validator_ids() -> Result<JsValue, JsValue> {
  let ids = stella_stdnum_core::validators()
    .iter()
    .map(|validator| validator.id())
    .collect::<Vec<_>>();
  serialize(&ids)
}

#[wasm_bindgen(js_name = validators)]
pub fn validators() -> Result<JsValue, JsValue> {
  let registry = stella_stdnum_core::validators()
    .iter()
    .map(|validator| metadata(validator))
    .collect::<Vec<_>>();
  serialize(&registry)
}

#[wasm_bindgen(js_name = validatorMetadata)]
pub fn validator_metadata(id: &str) -> Result<JsValue, JsValue> {
  serialize(&metadata(find_validator(id)?))
}

#[wasm_bindgen(js_name = validate)]
pub fn validate(id: &str, value: &str) -> Result<JsValue, JsValue> {
  let result = match find_validator(id)?.validate(value) {
    Ok(compact) => WasmValidationResult {
      valid: true,
      compact: Some(compact),
      error: None,
    },
    Err(error) => validation_error(&error),
  };
  serialize(&result)
}

#[wasm_bindgen(js_name = compact)]
pub fn compact(id: &str, value: &str) -> Result<String, JsValue> {
  Ok(find_validator(id)?.compact(value))
}

#[wasm_bindgen(js_name = format)]
pub fn format(id: &str, value: &str) -> Result<String, JsValue> {
  Ok(find_validator(id)?.format(value))
}

#[wasm_bindgen(js_name = generate)]
pub fn generate(id: &str) -> Result<Option<String>, JsValue> {
  Ok(find_validator(id)?.generate())
}

#[wasm_bindgen(js_name = parse)]
pub fn parse(id: &str, value: &str) -> Result<JsValue, JsValue> {
  let parsed = find_validator(id)?.parse(value).map(parsed_identifier);
  serialize(&parsed)
}

#[wasm_bindgen(js_name = detectNetwork)]
#[must_use]
pub fn credit_card_detect_network(value: &str) -> Option<String> {
  stella_stdnum_core::validators::global::creditcard::detect_network(value)
    .map(|network| network.as_str().to_owned())
}

#[wasm_bindgen(js_name = hasValidEip55Checksum)]
#[must_use]
pub fn eth_has_valid_eip55_checksum(value: &str) -> bool {
  stella_stdnum_core::validators::crypto::eth::has_valid_eip55_checksum(value)
}

#[wasm_bindgen(js_name = decodeBase58)]
#[must_use]
pub fn btc_base58_decode(value: &str) -> Option<Vec<u8>> {
  stella_stdnum_core::validators::crypto::btcbase58::decode_base58(value)
}

#[wasm_bindgen(js_name = polymod)]
#[must_use]
#[allow(clippy::needless_pass_by_value)] // wasm-bindgen owns JavaScript arrays.
pub fn btc_bech32_polymod(values: Vec<u32>) -> u32 {
  stella_stdnum_core::validators::crypto::btcbech32::polymod(&values)
}

#[wasm_bindgen(js_name = convertBits)]
#[must_use]
#[allow(clippy::needless_pass_by_value)] // wasm-bindgen owns JavaScript arrays.
pub fn btc_bech32_convert_bits(
  values: Vec<u32>,
  from_bits: u32,
  to_bits: u32,
) -> Option<Vec<u32>> {
  stella_stdnum_core::validators::crypto::btcbech32::convert_bits(
    &values, from_bits, to_bits,
  )
}

#[wasm_bindgen(js_name = validateBech32)]
pub fn btc_bech32_validate(value: &str) -> Result<JsValue, JsValue> {
  use stella_stdnum_core::validators::crypto::btcbech32::Bech32ErrorCode;

  let result =
    match stella_stdnum_core::validators::crypto::btcbech32::validate_bech32(
      value,
    ) {
      Ok(()) => WasmBech32Validation {
        valid: true,
        code: None,
      },
      Err(error) => WasmBech32Validation {
        valid: false,
        code: Some(match error {
          Bech32ErrorCode::Format => "format",
          Bech32ErrorCode::Checksum => "checksum",
          Bech32ErrorCode::Component => "component",
        }),
      },
    };
  serialize(&result)
}

#[wasm_bindgen(js_name = beNnChecksum)]
#[must_use]
pub fn be_nn_checksum(value: &str) -> Option<i32> {
  stella_stdnum_core::validators::be::nn::checksum(value)
}

#[wasm_bindgen(js_name = esVatCifChecksum)]
#[must_use]
pub fn es_vat_cif_checksum(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::es::vat::cif_checksum(value)
}

#[wasm_bindgen(js_name = eeIkTwoPassCheck)]
#[must_use]
pub fn ee_ik_two_pass_check(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::ee::ik::two_pass_check(value)
}

#[wasm_bindgen(js_name = gbNhsCalcCheckDigit)]
#[must_use]
pub fn gb_nhs_calc_check_digit(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::gb::nhs::calc_check_digit(value)
}

#[wasm_bindgen(js_name = gbSedolCalcCheckDigit)]
#[must_use]
pub fn gb_sedol_calc_check_digit(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::gb::sedol::calc_check_digit(value)
}

#[wasm_bindgen(js_name = luhnGenerate)]
#[must_use]
pub fn luhn_generate(length: Option<u32>) -> String {
  let length = length
    .and_then(|value| usize::try_from(value).ok())
    .unwrap_or(16);
  stella_stdnum_core::validators::global::luhn::generate(length)
}

#[wasm_bindgen(js_name = validateId)]
#[must_use]
#[allow(clippy::needless_pass_by_value)] // Preserve the optional JavaScript string ABI.
pub fn validate_id(
  validator: &str,
  value: &str,
  input: Option<String>,
) -> bool {
  stella_stdnum_core::validate_id(validator, value, input.as_deref())
}

#[wasm_bindgen(js_name = validateNamedId)]
#[must_use]
pub fn validate_named_id(validator: &str, value: &str) -> bool {
  stella_stdnum_core::validate_named_id(validator, value)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn metadata_is_projected_without_loss() {
    let Some(validator) = stella_stdnum_core::validator("at.businessid") else {
      return;
    };
    let result = metadata(validator);
    assert_eq!(result.country, Some("AT"));
    assert_eq!(result.scope, "country");
    assert!(result.can_generate);
  }

  #[test]
  fn errors_preserve_stable_codes() {
    let Some(validator) = stella_stdnum_core::validator("au.abn") else {
      return;
    };
    let Err(error) = validator.validate("bad") else {
      return;
    };
    let result = validation_error(&error);
    assert_eq!(result.error.map(|value| value.code), Some("INVALID_FORMAT"));
  }
}

use pyo3::{exceptions::PyKeyError, prelude::*};
use stella_stdnum_core::{
  EntityType, Gender, ParsedIdentifier, ValidationError, Validator,
  ValidatorScope,
};

/// A validation error returned as structured Python data.
#[pyclass(frozen, get_all, skip_from_py_object, name = "ValidationError")]
#[derive(Clone)]
struct PyValidationError {
  code: String,
  message: String,
}

/// A stable result object that carries either compact output or an error.
#[pyclass(frozen, get_all, name = "ValidationResult")]
struct PyValidationResult {
  valid: bool,
  compact: Option<String>,
  error: Option<PyValidationError>,
}

/// Structured data encoded by a personal identifier.
#[pyclass(frozen, get_all, name = "ParsedIdentifier")]
struct PyParsedIdentifier {
  birth_year: i32,
  birth_month: u8,
  birth_day: u8,
  gender: Option<String>,
}

/// Result from the lower-level Bitcoin Bech32 parser.
#[pyclass(frozen, get_all, name = "Bech32Validation")]
struct PyBech32Validation {
  valid: bool,
  code: Option<String>,
}

/// Metadata for a validator in the Rust registry.
#[pyclass(frozen, get_all, name = "ValidatorMetadata")]
struct PyValidatorMetadata {
  id: String,
  name: String,
  local_name: String,
  abbreviation: String,
  description: Option<String>,
  aliases: Vec<String>,
  candidate_pattern: String,
  scope: String,
  country: Option<String>,
  entity_type: String,
  source_url: Option<String>,
  lengths: Vec<usize>,
  examples: Vec<String>,
  can_generate: bool,
  can_parse: bool,
}

fn find_validator(id: &str) -> PyResult<&'static Validator> {
  stella_stdnum_core::validator(id)
    .ok_or_else(|| PyKeyError::new_err(format!("unknown validator id: {id}")))
}

fn validation_error(error: &ValidationError) -> PyValidationResult {
  PyValidationResult {
    valid: false,
    compact: None,
    error: Some(PyValidationError {
      code: error.code().as_str().to_owned(),
      message: error.message().to_owned(),
    }),
  }
}

fn metadata(validator: &Validator) -> PyValidatorMetadata {
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

  PyValidatorMetadata {
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
    lengths: validator.lengths().to_vec(),
    examples: validator
      .examples()
      .iter()
      .map(ToString::to_string)
      .collect(),
    can_generate: validator.can_generate(),
    can_parse: validator.can_parse(),
  }
}

fn parsed_identifier(parsed: ParsedIdentifier) -> PyParsedIdentifier {
  PyParsedIdentifier {
    birth_year: parsed.birth_date.year,
    birth_month: parsed.birth_date.month,
    birth_day: parsed.birth_date.day,
    gender: parsed.gender.map(|gender| match gender {
      Gender::Male => "male".to_owned(),
      Gender::Female => "female".to_owned(),
    }),
  }
}

#[pyfunction]
fn validator_ids() -> Vec<String> {
  stella_stdnum_core::validators()
    .iter()
    .map(|validator| validator.id().to_owned())
    .collect()
}

#[pyfunction]
fn validators() -> Vec<PyValidatorMetadata> {
  stella_stdnum_core::validators()
    .iter()
    .map(|validator| metadata(validator))
    .collect()
}

#[pyfunction]
fn validator_metadata(id: &str) -> PyResult<PyValidatorMetadata> {
  find_validator(id).map(metadata)
}

#[pyfunction]
fn validate(id: &str, value: &str) -> PyResult<PyValidationResult> {
  let validator = find_validator(id)?;
  Ok(match validator.validate(value) {
    Ok(compact) => PyValidationResult {
      valid: true,
      compact: Some(compact),
      error: None,
    },
    Err(error) => validation_error(&error),
  })
}

#[pyfunction]
fn compact(id: &str, value: &str) -> PyResult<String> {
  Ok(find_validator(id)?.compact(value))
}

#[pyfunction]
fn format(id: &str, value: &str) -> PyResult<String> {
  Ok(find_validator(id)?.format(value))
}

#[pyfunction]
fn generate(id: &str) -> PyResult<Option<String>> {
  Ok(find_validator(id)?.generate())
}

#[pyfunction]
fn parse(id: &str, value: &str) -> PyResult<Option<PyParsedIdentifier>> {
  Ok(find_validator(id)?.parse(value).map(parsed_identifier))
}

#[pyfunction]
fn credit_card_detect_network(value: &str) -> Option<String> {
  stella_stdnum_core::validators::global::creditcard::detect_network(value)
    .map(|network| network.as_str().to_owned())
}

#[pyfunction]
fn eth_has_valid_eip55_checksum(value: &str) -> bool {
  stella_stdnum_core::validators::crypto::eth::has_valid_eip55_checksum(value)
}

#[pyfunction]
fn btc_base58_decode(value: &str) -> Option<Vec<u8>> {
  stella_stdnum_core::validators::crypto::btcbase58::decode_base58(value)
}

#[pyfunction]
#[allow(clippy::needless_pass_by_value)] // PyO3 owns Python list arguments.
fn btc_bech32_polymod(values: Vec<u32>) -> u32 {
  stella_stdnum_core::validators::crypto::btcbech32::polymod(&values)
}

#[pyfunction]
#[allow(clippy::needless_pass_by_value)] // PyO3 owns Python list arguments.
fn btc_bech32_convert_bits(
  values: Vec<u32>,
  from_bits: u32,
  to_bits: u32,
) -> Option<Vec<u32>> {
  stella_stdnum_core::validators::crypto::btcbech32::convert_bits(
    &values, from_bits, to_bits,
  )
}

#[pyfunction]
fn btc_bech32_validate(value: &str) -> PyBech32Validation {
  use stella_stdnum_core::validators::crypto::btcbech32::Bech32ErrorCode;

  match stella_stdnum_core::validators::crypto::btcbech32::validate_bech32(
    value,
  ) {
    Ok(()) => PyBech32Validation {
      valid: true,
      code: None,
    },
    Err(error) => PyBech32Validation {
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

#[pyfunction]
fn be_nn_checksum(value: &str) -> Option<i32> {
  stella_stdnum_core::validators::be::nn::checksum(value)
}

#[pyfunction]
fn es_vat_cif_checksum(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::es::vat::cif_checksum(value)
}

#[pyfunction]
fn ee_ik_two_pass_check(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::ee::ik::two_pass_check(value)
}

#[pyfunction]
fn gb_nhs_calc_check_digit(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::gb::nhs::calc_check_digit(value)
}

#[pyfunction]
fn gb_sedol_calc_check_digit(value: &str) -> Option<u32> {
  stella_stdnum_core::validators::gb::sedol::calc_check_digit(value)
}

#[pyfunction(signature = (length=16))]
fn luhn_generate(length: usize) -> String {
  stella_stdnum_core::validators::global::luhn::generate(length)
}

/// Compatibility entry point for the pre-registry boolean API.
#[pyfunction]
fn validate_id(validator: &str, value: &str, input: Option<&str>) -> bool {
  stella_stdnum_core::validate_id(validator, value, input)
}

/// Compatibility entry point for the pre-registry boolean API.
#[pyfunction]
fn validate_named_id(validator: &str, value: &str) -> bool {
  stella_stdnum_core::validate_named_id(validator, value)
}

#[pymodule]
fn _native(module: &Bound<'_, PyModule>) -> PyResult<()> {
  module.add_class::<PyValidationError>()?;
  module.add_class::<PyValidationResult>()?;
  module.add_class::<PyParsedIdentifier>()?;
  module.add_class::<PyBech32Validation>()?;
  module.add_class::<PyValidatorMetadata>()?;
  module.add_function(wrap_pyfunction!(validator_ids, module)?)?;
  module.add_function(wrap_pyfunction!(validators, module)?)?;
  module.add_function(wrap_pyfunction!(validator_metadata, module)?)?;
  module.add_function(wrap_pyfunction!(validate, module)?)?;
  module.add_function(wrap_pyfunction!(compact, module)?)?;
  module.add_function(wrap_pyfunction!(format, module)?)?;
  module.add_function(wrap_pyfunction!(generate, module)?)?;
  module.add_function(wrap_pyfunction!(parse, module)?)?;
  module.add_function(wrap_pyfunction!(credit_card_detect_network, module)?)?;
  module
    .add_function(wrap_pyfunction!(eth_has_valid_eip55_checksum, module)?)?;
  module.add_function(wrap_pyfunction!(btc_base58_decode, module)?)?;
  module.add_function(wrap_pyfunction!(btc_bech32_polymod, module)?)?;
  module.add_function(wrap_pyfunction!(btc_bech32_convert_bits, module)?)?;
  module.add_function(wrap_pyfunction!(btc_bech32_validate, module)?)?;
  module.add_function(wrap_pyfunction!(be_nn_checksum, module)?)?;
  module.add_function(wrap_pyfunction!(es_vat_cif_checksum, module)?)?;
  module.add_function(wrap_pyfunction!(ee_ik_two_pass_check, module)?)?;
  module.add_function(wrap_pyfunction!(gb_nhs_calc_check_digit, module)?)?;
  module.add_function(wrap_pyfunction!(gb_sedol_calc_check_digit, module)?)?;
  module.add_function(wrap_pyfunction!(luhn_generate, module)?)?;
  module.add_function(wrap_pyfunction!(validate_id, module)?)?;
  module.add_function(wrap_pyfunction!(validate_named_id, module)?)?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn validation_errors_preserve_code_and_message() -> PyResult<()> {
    let result = validate("au.abn", "bad")?;
    assert!(!result.valid);
    let Some(error) = result.error else {
      return Ok(());
    };
    assert_eq!(error.code, "INVALID_FORMAT");
    assert!(!error.message.is_empty());
    Ok(())
  }

  #[test]
  fn metadata_preserves_registry_fields() -> PyResult<()> {
    let result = validator_metadata("at.businessid")?;
    assert_eq!(result.country.as_deref(), Some("AT"));
    assert!(result.can_generate);
    Ok(())
  }
}

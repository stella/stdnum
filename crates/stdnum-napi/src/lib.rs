#![allow(clippy::needless_pass_by_value)]

use napi_derive::napi;

#[napi(js_name = "validateId")]
#[must_use]
pub fn validate_id(
  validator: String,
  value: String,
  input: Option<String>,
) -> bool {
  stella_stdnum_core::validate_id(&validator, &value, input.as_deref())
}

#[napi(js_name = "validateNamedId")]
#[must_use]
pub fn validate_named_id(validator: String, value: String) -> bool {
  stella_stdnum_core::validate_named_id(&validator, &value)
}

use pyo3::prelude::*;

#[pyfunction]
fn validate_id(validator: &str, value: &str, input: Option<&str>) -> bool {
  stella_stdnum_core::validate_id(validator, value, input)
}

#[pyfunction]
fn validate_named_id(validator: &str, value: &str) -> bool {
  stella_stdnum_core::validate_named_id(validator, value)
}

#[pymodule]
fn stella_stdnum_core_py(module: &Bound<'_, PyModule>) -> PyResult<()> {
  module.add_function(wrap_pyfunction!(validate_id, module)?)?;
  module.add_function(wrap_pyfunction!(validate_named_id, module)?)?;
  Ok(())
}

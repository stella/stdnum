use stella_stdnum_core::{
  EntityType, ValidationError, ValidationErrorCode, ValidatorScope, validator,
  validators,
};

const CASES: &[(&str, &str, &str, &str)] = &[
  ("at.businessid", "FN 122119M", "122119m", "FN 122119m"),
  ("au.abn", "83 914 571 673", "83914571673", "83 914 571 673"),
  ("br.cpf", "390.533.447-05", "39053344705", "390.533.447-05"),
  ("es.dni", "54 362 315-k", "54362315K", "54362315K"),
  ("us.ein", "04-2103594", "042103594", "04-2103594"),
];

#[test]
fn vertical_slice_exposes_full_behavior() {
  assert!(validators().len() >= CASES.len());
  for (id, input, expected_compact, expected_format) in CASES {
    let spec = validator(id);
    assert!(spec.is_some(), "missing validator {id}");
    if let Some(spec) = spec {
      assert_eq!(spec.compact(input), *expected_compact);
      assert_eq!(spec.format(input), *expected_format);
      assert_eq!(spec.validate(input), Ok((*expected_compact).to_owned()));
      assert!(spec.is_valid(input));
      assert!(spec.can_generate());

      let generated = spec.generate();
      assert!(generated.is_some(), "{id} did not generate a value");
      if let Some(generated) = generated {
        assert!(
          spec.validate(&generated).is_ok(),
          "{id} generated invalid value {generated}"
        );
      }

      let pattern = spec.to_regex();
      assert!(pattern.is_ok(), "{id} candidate pattern did not compile");
      if let Ok(pattern) = pattern {
        assert!(pattern.is_match(expected_format));
      }
    }
  }
}

#[test]
fn vertical_slice_preserves_typed_errors() {
  let cases = [
    (
      "au.abn",
      "83914571674",
      ValidationErrorCode::InvalidChecksum,
    ),
    ("br.cpf", "3905334470", ValidationErrorCode::InvalidLength),
    ("es.dni", "54362315A", ValidationErrorCode::InvalidChecksum),
    ("us.ein", "001234567", ValidationErrorCode::InvalidComponent),
  ];

  for (id, value, expected_code) in cases {
    let spec = validator(id);
    assert!(spec.is_some(), "missing validator {id}");
    if let Some(spec) = spec {
      let result = spec.validate(value);
      assert!(result.is_err(), "{id} unexpectedly accepted {value}");
      if let Err(error) = result {
        assert_eq!(error.code(), expected_code);
        assert!(!error.message().is_empty());
      }
    }
  }

  let business_id = validator("at.businessid");
  assert!(business_id.is_some(), "missing at.businessid");
  if let Some(business_id) = business_id {
    assert!(matches!(
      business_id.validate("FN 12"),
      Err(ValidationError::InvalidFormat(_))
    ));
  }
}

#[test]
fn registry_metadata_is_module_owned() {
  let cpf = validator("br.cpf");
  assert!(cpf.is_some(), "missing br.cpf");
  if let Some(cpf) = cpf {
    assert_eq!(cpf.name(), "Brazilian CPF");
    assert_eq!(cpf.local_name(), "Cadastro de Pessoas Físicas");
    assert_eq!(cpf.abbreviation(), "CPF");
    assert_eq!(cpf.aliases(), &["CPF", "Cadastro de Pessoas Físicas"]);
    assert_eq!(cpf.entity_type(), EntityType::Person);
    assert_eq!(
      cpf.scope(),
      ValidatorScope::Country(stella_stdnum_core::CountryCode::Br)
    );
    assert_eq!(cpf.examples(), &["39053344705"]);
    assert_eq!(cpf.candidate_pattern(), r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}");
    assert!(cpf.source_url().is_some());
  }

  let dni = validator("es.dni");
  assert!(dni.is_some(), "missing es.dni");
  if let Some(dni) = dni {
    assert_eq!(dni.lengths(), &[2, 3, 4, 5, 6, 7, 8, 9]);
  }
}

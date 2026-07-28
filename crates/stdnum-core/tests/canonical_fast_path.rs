use std::{alloc::System, hint::black_box};

use stats_alloc::{INSTRUMENTED_SYSTEM, Region, StatsAlloc};
use stella_stdnum_core::{
  CanonicalValidation, ValidationResult, validator,
  validators::{at, be, ch, cz, de, fr, global, pl, sk},
};

#[global_allocator]
static GLOBAL: &StatsAlloc<System> = &INSTRUMENTED_SYSTEM;

const CANONICAL_FIXTURES: [(&str, &str); 4] = [
  ("br.cpf", "39053344705"),
  ("cl.rut", "760864285"),
  ("cz.bankaccount", "034278-0727558021/0100"),
  ("pl.nip", "2234567895"),
];

type CanonicalPredicate = fn(&str) -> bool;
type FullValidator = fn(&str) -> ValidationResult;

const SELECTED_MODULE_FIXTURES: &[(
  &str,
  &str,
  CanonicalPredicate,
  FullValidator,
)] = &[
  (
    "iban",
    "DE89370400440532013000",
    global::iban::is_valid_canonical,
    global::iban::validate,
  ),
  (
    "at.businessid",
    "122119m",
    at::businessid::is_valid_canonical,
    at::businessid::validate,
  ),
  (
    "at.tin",
    "591199013",
    at::tin::is_valid_canonical,
    at::tin::validate,
  ),
  (
    "at.uid",
    "U13585627",
    at::uid::is_valid_canonical,
    at::uid::validate,
  ),
  (
    "at.vnr",
    "1237010180",
    at::vnr::is_valid_canonical,
    at::vnr::validate,
  ),
  (
    "be.vat",
    "0776091951",
    be::vat::is_valid_canonical,
    be::vat::validate,
  ),
  (
    "ch.ssn",
    "7561234567897",
    ch::ssn::is_valid_canonical,
    ch::ssn::validate,
  ),
  (
    "cz.bankaccount",
    "034278-0727558021/0100",
    cz::bankaccount::is_valid_canonical,
    cz::bankaccount::validate,
  ),
  (
    "cz.dic",
    "25123891",
    cz::dic::is_valid_canonical,
    cz::dic::validate,
  ),
  (
    "cz.rc",
    "7103192745",
    cz::rc::is_valid_canonical,
    cz::rc::validate,
  ),
  (
    "de.handelsreg",
    "HRB 12345",
    de::handelsreg::is_valid_canonical,
    de::handelsreg::validate,
  ),
  (
    "de.idnr",
    "36574261809",
    de::idnr::is_valid_canonical,
    de::idnr::validate,
  ),
  (
    "de.stnr",
    "2181508150",
    de::stnr::is_valid_canonical,
    de::stnr::validate,
  ),
  (
    "de.svnr",
    "12010188M011",
    de::svnr::is_valid_canonical,
    de::svnr::validate,
  ),
  (
    "de.vat",
    "136695976",
    de::vat::is_valid_canonical,
    de::vat::validate,
  ),
  (
    "fr.tva",
    "40303265045",
    fr::tva::is_valid_canonical,
    fr::tva::validate,
  ),
  (
    "pl.nip",
    "2234567895",
    pl::nip::is_valid_canonical,
    pl::nip::validate,
  ),
  (
    "sk.dic",
    "2021853504",
    sk::dic::is_valid_canonical,
    sk::dic::validate,
  ),
  (
    "sk.rc",
    "7103192745",
    sk::rc::is_valid_canonical,
    sk::rc::validate,
  ),
];

#[test]
fn canonical_validation_invariants() {
  for (id, value) in CANONICAL_FIXTURES {
    let selected = validator(id);
    assert!(selected.is_some(), "missing validator {id}");
    if let Some(validator) = selected {
      let allocations = Region::new(GLOBAL);
      let result = validator.validate_canonical(black_box(value));
      let allocations = allocations.change();
      assert_eq!(result, CanonicalValidation::Valid, "{id}");
      assert_eq!(
        allocations.allocations, 0,
        "{id} canonical validation allocated"
      );
      assert_eq!(
        allocations.reallocations, 0,
        "{id} canonical validation reallocated"
      );
      assert_eq!(
        allocations.bytes_allocated, 0,
        "{id} canonical validation allocated bytes"
      );
    }
  }
  let fixtures = [
    ("br.cpf", "390.533.447-05", "39053344705"),
    ("cl.rut", "76.086.428-5", "760864285"),
    ("pl.nip", "PL 223-456-78-95", "2234567895"),
  ];
  for (id, value, expected) in fixtures {
    let selected = validator(id);
    assert!(selected.is_some(), "missing validator {id}");
    if let Some(validator) = selected {
      assert_eq!(
        validator.validate_canonical(value),
        CanonicalValidation::NotCanonical
      );
      assert_eq!(validator.validate(value).as_deref(), Ok(expected));
    }
  }

  for (id, value, is_valid_canonical, validate) in SELECTED_MODULE_FIXTURES {
    assert!(
      validate(value).is_ok(),
      "invalid full-validator fixture: {id}"
    );
    assert!(is_valid_canonical(value), "invalid canonical fixture: {id}");

    for (candidate, expected) in [(*value, true), ("not canonical", false)] {
      let allocations = Region::new(GLOBAL);
      let valid = is_valid_canonical(black_box(candidate));
      let allocations = allocations.change();

      assert_eq!(valid, expected, "unexpected canonical result: {id}");
      assert_eq!(
        allocations.allocations, 0,
        "{id} canonical predicate allocated"
      );
      assert_eq!(
        allocations.reallocations, 0,
        "{id} canonical predicate reallocated"
      );
      assert_eq!(
        allocations.bytes_allocated, 0,
        "{id} canonical predicate allocated bytes"
      );
    }
  }
}

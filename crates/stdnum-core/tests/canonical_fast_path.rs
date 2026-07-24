use std::{alloc::System, hint::black_box};

use stats_alloc::{INSTRUMENTED_SYSTEM, Region, StatsAlloc};
use stella_stdnum_core::{CanonicalValidation, validator};

#[global_allocator]
static GLOBAL: &StatsAlloc<System> = &INSTRUMENTED_SYSTEM;

const CANONICAL_FIXTURES: [(&str, &str); 3] = [
  ("br.cpf", "39053344705"),
  ("cl.rut", "760864285"),
  ("pl.nip", "2234567895"),
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
}

use std::collections::HashSet;

use serde::Deserialize;
use stella_stdnum_core::{validator, validators};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureSet {
  fixtures: Vec<Fixture>,
}

#[derive(Debug, Deserialize)]
struct Fixture {
  id: String,
  value: String,
  expected: bool,
  compact: String,
  format: String,
}

#[test]
fn registry_and_committed_fixtures_are_in_parity() {
  let fixture_set = serde_json::from_str::<FixtureSet>(include_str!(
    "../../../packages/stdnum/fixtures/parity.json"
  ));
  assert!(
    fixture_set.is_ok(),
    "committed parity fixtures must be valid JSON: {fixture_set:?}"
  );
  let fixture_set = fixture_set.unwrap_or(FixtureSet {
    fixtures: Vec::new(),
  });

  let registered = validators();
  assert_eq!(registered.len(), 176);
  let unique = registered
    .iter()
    .map(|candidate| candidate.id())
    .collect::<HashSet<_>>();
  assert_eq!(unique.len(), registered.len(), "duplicate registry id");

  let mut differences = Vec::new();
  for fixture in fixture_set.fixtures {
    let candidate = validator(&fixture.id);
    assert!(
      candidate.is_some(),
      "fixture references unknown validator {}",
      fixture.id
    );
    let Some(candidate) = candidate else {
      continue;
    };
    let result = candidate.validate(&fixture.value);
    if result.is_ok() != fixture.expected {
      differences.push(format!(
        "{} validation differed for {}: {result:?}",
        fixture.id, fixture.value
      ));
    }
    let compact = candidate.compact(&fixture.value);
    if compact != fixture.compact {
      differences.push(format!(
        "{} compact: {compact:?} != {:?}",
        fixture.id, fixture.compact
      ));
    }
    let formatted = candidate.format(&fixture.value);
    if formatted != fixture.format {
      differences.push(format!(
        "{} format: {formatted:?} != {:?}",
        fixture.id, fixture.format
      ));
    }
  }
  assert!(differences.is_empty(), "{}", differences.join("\n"));
}

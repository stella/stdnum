use serde::Serialize;
use std::io::Write as _;
use stella_stdnum_core::{EntityType, Validator, ValidatorScope};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Registry<'a> {
  #[serde(rename = "$schema")]
  schema: &'static str,
  schema_version: u32,
  validators: Vec<RegistryValidator<'a>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RegistryValidator<'a> {
  abbreviation: &'a str,
  aliases: &'a [&'a str],
  can_generate: bool,
  candidate_pattern: Option<&'a str>,
  country: Option<&'a str>,
  description: Option<&'a str>,
  entity_type: &'static str,
  examples: &'a [&'a str],
  export_name: &'a str,
  id: &'a str,
  lengths: &'a [usize],
  local_name: &'a str,
  name: &'a str,
  named_exports: Vec<&'static str>,
  namespace_export: Option<&'a str>,
  parse_kind: Option<&'static str>,
  scope: &'static str,
  source_url: Option<&'a str>,
  subpath: String,
}

fn metadata(validator: &'static Validator) -> RegistryValidator<'static> {
  let id = validator.id();
  let (scope, country) = match validator.scope() {
    ValidatorScope::Country(country) => ("country", Some(country.as_str())),
    ValidatorScope::Global => ("global", None),
  };
  let entity_type = match validator.entity_type() {
    EntityType::Person => "person",
    EntityType::Company => "company",
    EntityType::Any => "any",
  };
  let (namespace, export_name) = id
    .split_once('.')
    .map_or((None, id), |(namespace, export_name)| {
      (Some(namespace_export(namespace)), export_name)
    });
  let mut named_exports = vec!["compact", "format", "validate"];
  if validator.can_generate() && !matches!(id, "creditcard" | "md.idno") {
    named_exports.push("generate");
  }
  if validator.can_parse() {
    named_exports.push("parse");
  }
  named_exports.extend_from_slice(special_exports(id));
  named_exports.sort_unstable();

  RegistryValidator {
    abbreviation: validator.abbreviation(),
    aliases: validator.aliases(),
    can_generate: validator.can_generate(),
    candidate_pattern: (!validator.candidate_pattern().is_empty())
      .then_some(validator.candidate_pattern()),
    country,
    description: validator.description(),
    entity_type,
    examples: validator.examples(),
    export_name,
    id,
    lengths: validator.lengths(),
    local_name: validator.local_name(),
    name: validator.name(),
    named_exports,
    namespace_export: namespace,
    parse_kind: parse_kind(validator),
    scope,
    source_url: validator.source_url(),
    subpath: subpath(id),
  }
}

fn namespace_export(namespace: &str) -> &str {
  match namespace {
    "do" => "do_",
    "in" => "in_",
    "is" => "is_",
    other => other,
  }
}

fn subpath(id: &str) -> String {
  if id == "it.codiceFiscale" {
    return "it/codicefiscale".to_owned();
  }
  id.replace('.', "/")
}

fn parse_kind(validator: &Validator) -> Option<&'static str> {
  if !validator.can_parse() {
    return None;
  }
  if validator.id() == "kw.civil" {
    Some("birthDate")
  } else {
    Some("person")
  }
}

fn special_exports(id: &str) -> &'static [&'static str] {
  match id {
    "be.nn" => &["checksum"],
    "creditcard" => &["detectNetwork"],
    "crypto.btcbase58" => &["decodeBase58"],
    "crypto.btcbech32" => &["convertBits", "polymod", "validateBech32"],
    "crypto.eth" => &["hasValidEip55Checksum"],
    "ee.ik" => &["twoPassCheck"],
    "es.dni" => &["CHECK_LETTERS"],
    "es.vat" => &["cifChecksum"],
    "gb.nhs" | "gb.sedol" => &["calcCheckDigit"],
    _ => &[],
  }
}

fn main() -> std::io::Result<()> {
  let mut validators = stella_stdnum_core::validators()
    .iter()
    .map(|validator| metadata(validator))
    .collect::<Vec<_>>();
  validators.sort_unstable_by(|left, right| left.subpath.cmp(&right.subpath));
  let registry = Registry {
    schema: "./registry.schema.json",
    schema_version: 1,
    validators,
  };
  let output =
    serde_json::to_string_pretty(&registry).map_err(std::io::Error::other)?;
  let stdout = std::io::stdout();
  let mut handle = stdout.lock();
  handle.write_all(output.as_bytes())?;
  handle.write_all(b"\n")
}

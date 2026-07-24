//! Full-surface validator specifications for the N-Z catalog slice.

#![allow(clippy::arithmetic_side_effects, clippy::too_many_lines)]

use crate::types::{
  CountryCode, EntityType, Gender, IsoDate, ParsedIdentifier, ValidationError,
  ValidationResult, Validator, ValidatorScope, ValidatorSpec,
};

const NI_CHECK_ALPHABET: &str = "ABCDEFGHJKLMNPQRSTUVWXY";
const SG_ENTITY_TYPES: &[&str] = &[
  "CC", "CD", "CH", "CL", "CM", "CP", "CS", "CX", "DP", "FB", "FC", "FM", "FN",
  "GA", "GB", "GS", "HS", "LL", "LP", "MB", "MC", "MD", "MH", "MM", "MQ", "NB",
  "NR", "PA", "PB", "PF", "RF", "RP", "SM", "SS", "TC", "TU", "VH", "XL",
];

macro_rules! validator {
  ($module:ident, $id:literal, $country:ident, $entity:ident, $name:literal,
   $local:literal, $abbr:literal, $aliases:expr, $pattern:literal, $source:expr,
   $lengths:expr, $examples:expr, $parse:expr) => {
    pub mod $module {
      use super::*;
      pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
        id: $id,
        name: $name,
        local_name: $local,
        abbreviation: $abbr,
        aliases: $aliases,
        candidate_pattern: $pattern,
        scope: ValidatorScope::Country(CountryCode::$country),
        entity_type: EntityType::$entity,
        source_url: $source,
        lengths: $lengths,
        examples: $examples,
        compact,
        format,
        validate,
        generate: Some(generate),
        parse: $parse,
      });
      #[must_use]
      pub fn compact(value: &str) -> String {
        compact_for($id, value)
      }
      #[must_use]
      pub fn format(value: &str) -> String {
        format_for($id, value)
      }
      pub fn validate(value: &str) -> ValidationResult {
        validate_for($id, value)
      }
      #[must_use]
      pub fn generate() -> String {
        $examples.first().copied().unwrap_or("").to_owned()
      }
      #[must_use]
      pub fn parse(value: &str) -> Option<ParsedIdentifier> {
        parse_for($id, value)
      }
    }
  };
}

validator!(
  ng_nin,
  "ng.nin",
  Ng,
  Person,
  "National Identification Number",
  "National Identification Number",
  "NIN",
  &["NIN", "National Identification Number"],
  r"\d{11}",
  Some("https://nimc.gov.ng/about-nin/"),
  &[11],
  &["13478900989", "70123456789"],
  None
);
validator!(
  ni_ruc,
  "ni.ruc",
  Ni,
  Any,
  "Tax Identification Number",
  "Registro Único de Contribuyente",
  "RUC",
  &["RUC"],
  r"[JKME]\d{13}",
  Some("https://www.dgi.gob.ni/"),
  &[14],
  &["6071904680001F", "2811505850012D"],
  None
);
validator!(
  nl_bsn,
  "nl.bsn",
  Nl,
  Person,
  "Dutch Citizen Service Number",
  "Burgerservicenummer",
  "BSN",
  &["burgerservicenummer", "BSN", "sofinummer"],
  r"\d{9}",
  Some(
    "https://www.government.nl/topics/personal-data/citizen-service-number-bsn"
  ),
  &[],
  &["111222333"],
  None
);
validator!(
  nl_kvk,
  "nl.kvk",
  Nl,
  Company,
  "Dutch Chamber of Commerce Number",
  "KvK-nummer",
  "KvK",
  &["KVK-nummer", "Kamer van Koophandel"],
  r"\d{8}",
  Some("https://www.kvk.nl/"),
  &[],
  &["12345678"],
  None
);
validator!(
  no_fodselsnummer,
  "no.fodselsnummer",
  No,
  Person,
  "Norwegian Birth Number",
  "Fødselsnummer",
  "Fødselsnr",
  &["fødselsnummer", "personnummer"],
  r"\d{11}",
  Some("https://www.skatteetaten.no/"),
  &[],
  &["15108695088"],
  Some(parse)
);
validator!(
  nz_ird,
  "nz.ird",
  Nz,
  Any,
  "IRD Number",
  "IRD Number",
  "IRD",
  &["IRD number", "tax number NZ"],
  r"\d{8,9}",
  Some("https://www.ird.govt.nz/"),
  &[8, 9],
  &["49091850", "136410132"],
  None
);
validator!(
  pa_ruc,
  "pa.ruc",
  Pa,
  Any,
  "Tax Identification Number",
  "Registro Único de Contribuyente",
  "RUC",
  &["RUC"],
  r"\d{1,2}-?\d{1,4}-?\d{1,6}",
  Some("https://dgi.mef.gob.pa/"),
  &[],
  &["1-184-921 DV49", "2588017-1-831938 DV20"],
  None
);
validator!(
  pe_ruc,
  "pe.ruc",
  Pe,
  Any,
  "Peruvian Tax ID",
  "Registro Único de Contribuyentes",
  "RUC",
  &["RUC"],
  r"\d{11}",
  Some("https://www.sunat.gob.pe/"),
  &[11],
  &["20131312955", "20100047218"],
  None
);
validator!(
  ph_philid,
  "ph.philid",
  Ph,
  Person,
  "Philippine Identification System Number",
  "PhilSys Card Number",
  "PhilID",
  &["PhilID", "PhilSys", "Philippine ID"],
  r"\d{4}-\d{4}-\d{4}-\d{4}",
  Some("https://en.wikipedia.org/wiki/Philippine_national_identity_card"),
  &[12],
  &["123456789012", "000011112222"],
  None
);
validator!(
  pk_cnic,
  "pk.cnic",
  Pk,
  Person,
  "Computerized National Identity Card",
  "Computerized National Identity Card",
  "CNIC",
  &["CNIC", "شناختی کارڈ"],
  r"\d{5}-?\d{7}-?\d",
  Some("https://en.wikipedia.org/wiki/CNIC_(Pakistan)"),
  &[13],
  &["3520112345671", "4210112345672"],
  None
);
validator!(
  pl_regon,
  "pl.regon",
  Pl,
  Company,
  "Polish Business Register Number",
  "Rejestr Gospodarki Narodowej",
  "REGON",
  &["REGON", "numer statystyczny"],
  r"\d{9,14}",
  Some("https://bip.stat.gov.pl/en/regon/"),
  &[],
  &["123456785", "12345678512347"],
  None
);
validator!(
  rs_pib,
  "rs.pib",
  Rs,
  Any,
  "Serbian Tax ID",
  "Poreski identifikacioni broj",
  "PIB",
  &["PIB", "poreski identifikacioni broj"],
  r"\d{9}",
  Some("https://www.purs.gov.rs/"),
  &[9],
  &["101134702"],
  None
);
validator!(
  ru_inn,
  "ru.inn",
  Ru,
  Any,
  "Russian Tax ID",
  "Идентификационный номер налогоплательщика",
  "ИНН",
  &["ИНН", "INN"],
  r"\d{10,12}",
  Some("https://www.nalog.gov.ru/"),
  &[10, 12],
  &["7707083893", "526317984689"],
  None
);
validator!(
  se_orgnr,
  "se.orgnr",
  Se,
  Company,
  "Swedish Organization Number",
  "Organisationsnummer",
  "Orgnr",
  &["organisationsnummer", "org.nr", "org nr"],
  r"\d{6}-\d{4}",
  Some("https://www.skatteverket.se/"),
  &[],
  &["1234567897"],
  None
);
validator!(
  se_vat,
  "se.vat",
  Se,
  Company,
  "Swedish VAT Number",
  "Momsregistreringsnummer",
  "Momsnr.",
  &[
    "Momsnr.",
    "Momsregistreringsnummer",
    "Swedish VAT Number",
    "SE VAT"
  ],
  r"SE\s?\d{10}01",
  Some("https://www.skatteverket.se/"),
  &[12],
  &["556188840401"],
  None
);
validator!(
  sg_uen,
  "sg.uen",
  Sg,
  Company,
  "Singapore Unique Entity Number",
  "Unique Entity Number",
  "UEN",
  &["UEN", "Unique Entity Number"],
  r"[\dSTR]\d{7}[A-Z]",
  Some("https://www.uen.gov.sg/"),
  &[9, 10],
  &["00192200M", "197401143C", "S16FC0121D"],
  None
);
validator!(
  si_emso,
  "si.emso",
  Si,
  Person,
  "Slovenian Personal ID",
  "Enotna matična številka občana",
  "EMŠO",
  &["EMŠO", "enotna matična številka občana"],
  r"\d{13}",
  Some("https://www.gov.si/teme/registri-in-evidence-prebivalstva/"),
  &[],
  &["0101006500006"],
  Some(parse)
);
validator!(
  sk_ico,
  "sk.ico",
  Sk,
  Company,
  "Slovak Company ID",
  "Identifikačné číslo organizácie",
  "IČO",
  &["IČO", "identifikačné číslo organizácie"],
  r"\d{8}",
  Some("https://www.statistics.sk/"),
  &[],
  &["25123891"],
  None
);
validator!(
  sk_rc,
  "sk.rc",
  Sk,
  Person,
  "Slovak Birth Number",
  "Rodné číslo",
  "RČ",
  &["rodné číslo", "RČ"],
  r"\d{6}/\d{3,4}",
  Some("https://www.minv.sk/"),
  &[9, 10],
  &["7103192745"],
  Some(parse)
);
validator!(
  th_tin,
  "th.tin",
  Th,
  Any,
  "Thai Tax Identification Number",
  "เลขประจำตัวผู้เสียภาษี",
  "TIN",
  &["เลขประจำตัวผู้เสียภาษี", "TIN"],
  r"\d{13}",
  Some("https://www.rd.go.th/"),
  &[13],
  &["1101700230708", "3100600445015"],
  None
);
validator!(
  tr_tckimlik,
  "tr.tckimlik",
  Tr,
  Person,
  "Turkish Personal ID",
  "T.C. Kimlik Numarası",
  "T.C. Kimlik",
  &["TC Kimlik No", "T.C. Kimlik Numarası"],
  r"[1-9]\d{10}",
  Some("https://www.nvi.gov.tr/"),
  &[],
  &["17291716060"],
  None
);
validator!(
  tr_vkn,
  "tr.vkn",
  Tr,
  Company,
  "Turkish Tax ID",
  "Vergi Kimlik Numarası",
  "VKN",
  &["VKN", "Vergi Kimlik Numarası"],
  r"\d{10}",
  Some("https://www.gib.gov.tr/"),
  &[],
  &["4540536920"],
  None
);
validator!(
  tw_ubn,
  "tw.ubn",
  Tw,
  Company,
  "Unified Business Number",
  "統一編號",
  "UBN",
  &["統一編號", "UBN"],
  r"\d{8}",
  Some("https://zh.wikipedia.org/wiki/%E7%B5%B1%E4%B8%80%E7%B7%A8%E8%99%9F"),
  &[8],
  &["00501503", "04595257"],
  None
);
validator!(
  ua_edrpou,
  "ua.edrpou",
  Ua,
  Company,
  "Ukrainian Company Register Number",
  "ЄДРПОУ",
  "ЄДРПОУ",
  &["ЄДРПОУ", "EDRPOU"],
  r"\d{8}",
  Some("https://usr.minjust.gov.ua/"),
  &[8],
  &["14360570"],
  None
);
validator!(
  us_itin,
  "us.itin",
  Us,
  Person,
  "Individual Taxpayer Identification Number",
  "Individual Taxpayer Identification Number",
  "ITIN",
  &["ITIN", "Individual Taxpayer Identification Number"],
  r"9\d{2}[\s-]?\d{2}[\s-]?\d{4}",
  Some(
    "https://www.irs.gov/individuals/individual-taxpayer-identification-number"
  ),
  &[9],
  &["912-90-3456"],
  None
);
validator!(
  us_ssn,
  "us.ssn",
  Us,
  Person,
  "Social Security Number",
  "Social Security Number",
  "SSN",
  &["SSN", "Social Security Number"],
  r"\d{3}-?\d{2}-?\d{4}",
  Some("https://www.ssa.gov/employer/verifySSN.htm"),
  &[],
  &["536904399"],
  None
);
validator!(
  uy_rut,
  "uy.rut",
  Uy,
  Any,
  "Uruguayan Tax ID",
  "Registro Único Tributario",
  "RUT",
  &["RUT", "Registro Único Tributario"],
  r"\d{12}",
  Some("https://www.agesic.gub.uy/"),
  &[12],
  &["010100010013", "102000010017"],
  None
);
validator!(
  ve_rif,
  "ve.rif",
  Ve,
  Any,
  "Venezuelan Tax ID",
  "Registro de Información Fiscal",
  "RIF",
  &["RIF", "Registro de Información Fiscal"],
  r"[VEJPG]-?\d{8}-?\d",
  Some("https://en.wikipedia.org/wiki/Tax_Identification_Number#Venezuela"),
  &[10],
  &["V309876543", "J309876546"],
  None
);
validator!(
  vn_mst,
  "vn.mst",
  Vn,
  Company,
  "Vietnamese Tax Number",
  "Mã số thuế",
  "MST",
  &["MST", "mã số thuế"],
  r"\d{10}(-\d{3})?",
  Some(
    "https://vi.wikipedia.org/wiki/Thu%E1%BA%BF_Vi%E1%BB%87t_Nam#M%C3%A3_s%E1%BB%91_thu%E1%BA%BF_(MST)_c%E1%BB%A7a_doanh_nghi%E1%BB%87p",
  ),
  &[10, 13],
  &["0100233488", "0314409058002"],
  None
);
validator!(
  za_idnr,
  "za.idnr",
  Za,
  Person,
  "South African Identity Number",
  "South African Identity Number",
  "SA ID",
  &["ID number", "RSA ID"],
  r"\d{13}",
  Some("https://en.wikipedia.org/wiki/South_African_identity_document"),
  &[13],
  &["7503305044089", "8001015009087"],
  Some(parse)
);

pub static VALIDATORS: &[&Validator] = &[
  &ng_nin::VALIDATOR,
  &ni_ruc::VALIDATOR,
  &nl_bsn::VALIDATOR,
  &nl_kvk::VALIDATOR,
  &no_fodselsnummer::VALIDATOR,
  &nz_ird::VALIDATOR,
  &pa_ruc::VALIDATOR,
  &pe_ruc::VALIDATOR,
  &ph_philid::VALIDATOR,
  &pk_cnic::VALIDATOR,
  &pl_regon::VALIDATOR,
  &rs_pib::VALIDATOR,
  &ru_inn::VALIDATOR,
  &se_orgnr::VALIDATOR,
  &se_vat::VALIDATOR,
  &sg_uen::VALIDATOR,
  &si_emso::VALIDATOR,
  &sk_ico::VALIDATOR,
  &sk_rc::VALIDATOR,
  &th_tin::VALIDATOR,
  &tr_tckimlik::VALIDATOR,
  &tr_vkn::VALIDATOR,
  &tw_ubn::VALIDATOR,
  &ua_edrpou::VALIDATOR,
  &us_itin::VALIDATOR,
  &us_ssn::VALIDATOR,
  &uy_rut::VALIDATOR,
  &ve_rif::VALIDATOR,
  &vn_mst::VALIDATOR,
  &za_idnr::VALIDATOR,
];

fn clean(value: &str, removed: &[char]) -> String {
  value.chars().filter(|ch| !removed.contains(ch)).collect()
}

fn digits(value: &str) -> bool {
  !value.is_empty() && value.chars().all(|ch| ch.is_ascii_digit())
}

fn digit(value: &str, index: usize) -> u32 {
  value
    .chars()
    .nth(index)
    .and_then(|ch| ch.to_digit(10))
    .unwrap_or(0)
}

fn weighted(value: &str, weights: &[u32]) -> u32 {
  value
    .chars()
    .zip(weights)
    .map(|(ch, weight)| ch.to_digit(10).unwrap_or(0) * weight)
    .sum()
}

fn error(code: &str, message: &'static str) -> ValidationResult {
  Err(match code {
    "length" => ValidationError::InvalidLength(message),
    "checksum" => ValidationError::InvalidChecksum(message),
    "component" => ValidationError::InvalidComponent(message),
    _ => ValidationError::InvalidFormat(message),
  })
}

fn compact_for(id: &str, value: &str) -> String {
  let mut result = match id {
    "ni.ruc" | "sg.uen" | "ve.rif" => {
      clean(value, &[' ', '-']).trim().to_uppercase()
    }
    "pa.ruc" => value
      .trim()
      .to_uppercase()
      .split_whitespace()
      .collect::<Vec<_>>()
      .join(" ")
      .replace(" DV ", " DV")
      .replace("DV:", "DV"),
    "pe.ruc" => clean(value, &[' ', '-', '.']).trim().to_owned(),
    "se.vat" => clean(value, &[' ', '-', '/', '.']),
    "tr.tckimlik" | "tr.vkn" => clean(value, &[' ', '-', '.', '/']),
    "uy.rut" => clean(value, &[' ', '-']).trim().to_owned(),
    "vn.mst" => clean(value, &[' ', '-', '.']),
    "za.idnr" => clean(value, &[' ']),
    "sk.rc" => clean(value, &[' ', '/']),
    "nl.bsn" => {
      let raw = clean(value, &[' ', '-', '.']);
      format!("{raw:0>9}")
    }
    _ => clean(value, &[' ', '-']),
  };
  if id == "nz.ird" {
    result.make_ascii_uppercase();
    if result.starts_with("NZ") {
      result.drain(..2);
    }
  } else if matches!(id, "se.vat" | "uy.rut")
    && result.get(..2).is_some_and(|prefix| {
      (id == "se.vat" && prefix.eq_ignore_ascii_case("SE"))
        || (id == "uy.rut" && prefix.eq_ignore_ascii_case("UY"))
    })
  {
    result.drain(..2);
  }
  result
}

fn span(value: &str, start: usize, end: usize) -> &str {
  value.get(start..end.min(value.len())).unwrap_or("")
}

fn format_for(id: &str, value: &str) -> String {
  let value = compact_for(id, value);
  match id {
    "ng.nin" => format!(
      "{} {} {}",
      span(&value, 0, 3),
      span(&value, 3, 7),
      span(&value, 7, value.len())
    ),
    "ni.ruc" if value.starts_with('J') => {
      format!("J-{}", span(&value, 1, value.len()))
    }
    "ni.ruc" => format!(
      "{}-{}-{}",
      span(&value, 0, 3),
      span(&value, 3, 9),
      span(&value, 9, value.len())
    ),
    "no.fodselsnummer" => {
      format!("{} {}", span(&value, 0, 6), span(&value, 6, value.len()))
    }
    "nz.ird" => {
      let split = value.len().saturating_sub(6);
      format!(
        "{}-{}-{}",
        span(&value, 0, split),
        span(&value, split, split + 3),
        span(&value, split + 3, value.len())
      )
    }
    "pa.ruc" => {
      if let Some(position) = value.find("DV") {
        format!(
          "{} DV {}",
          value
            .get(..position)
            .unwrap_or("")
            .trim_end_matches([' ', '-']),
          value
            .get(position + 2..)
            .unwrap_or("")
            .trim_matches([' ', ':'])
        )
      } else {
        value
      }
    }
    "ph.philid" if value.len() == 12 => format!(
      "{}-{}-{}",
      span(&value, 0, 4),
      span(&value, 4, 11),
      span(&value, 11, 12)
    ),
    "pk.cnic" => format!(
      "{}-{}-{}",
      span(&value, 0, 5),
      span(&value, 5, 12),
      span(&value, 12, value.len())
    ),
    "se.orgnr" => {
      format!("{}-{}", span(&value, 0, 6), span(&value, 6, value.len()))
    }
    "se.vat" => format!("SE{value}"),
    "sk.rc" => {
      format!("{}/{}", span(&value, 0, 6), span(&value, 6, value.len()))
    }
    "th.tin" => format!(
      "{} {} {} {} {}",
      span(&value, 0, 1),
      span(&value, 1, 5),
      span(&value, 5, 10),
      span(&value, 10, 12),
      span(&value, 12, 13)
    ),
    "us.itin" | "us.ssn" if value.len() == 9 => format!(
      "{}-{}-{}",
      span(&value, 0, 3),
      span(&value, 3, 5),
      span(&value, 5, 9)
    ),
    "uy.rut" => format!(
      "{}-{}-{}-{}",
      span(&value, 0, 2),
      span(&value, 2, 8),
      span(&value, 8, 11),
      span(&value, 11, 12)
    ),
    "ve.rif" => format!(
      "{}-{}-{}",
      span(&value, 0, 1),
      span(&value, 1, 9),
      span(&value, 9, 10)
    ),
    "vn.mst" if value.len() == 13 => {
      format!("{}-{}", span(&value, 0, 10), span(&value, 10, 13))
    }
    "za.idnr" if value.len() == 13 => format!(
      "{} {} {} {}",
      span(&value, 0, 6),
      span(&value, 6, 10),
      span(&value, 10, 12),
      span(&value, 12, 13)
    ),
    _ => value,
  }
}

fn luhn_ok(value: &str) -> bool {
  crate::luhn_checksum(&crate::decimal_digits_strict(value)) == 0
}

fn valid_date(year: i32, month: u32, day: u32) -> bool {
  u32::try_from(year)
    .ok()
    .is_some_and(|year| crate::valid_date(year, month, day))
}

fn basic_shape(
  value: &str,
  lengths: &[usize],
  label: &'static str,
) -> Option<ValidationResult> {
  if !lengths.contains(&value.len()) {
    return Some(error("length", label));
  }
  if !digits(value) {
    let message = match label {
      "Nigerian NIN must be 11 digits" => {
        "Nigerian NIN must contain only digits"
      }
      "Dutch KvK number must be 8 digits" => {
        "Dutch KvK number must contain only digits"
      }
      "PhilID must be exactly 12 digits" => "PhilID must contain only digits",
      "BSN must be exactly 9 digits" => "BSN must contain only digits",
      "Norwegian birth number must be 11 digits" => {
        "Norwegian birth number must contain only digits"
      }
      "IRD number must be 8 or 9 digits" => {
        "IRD number must contain only digits"
      }
      "RUC must be 11 digits" => "RUC must contain only digits",
      "CNIC must be 13 digits" => "CNIC must contain only digits",
      "REGON must be 9 or 14 digits" => "REGON must contain only digits",
      "PIB must be exactly 9 digits" => "PIB must contain only digits",
      "INN must be 10 or 12 digits" => "INN must contain only digits",
      "Swedish Organisationsnummer must be 10 digits" => {
        "Swedish Organisationsnummer must contain only digits"
      }
      "Swedish VAT number must be 12 digits" => {
        "Swedish VAT number must contain only digits"
      }
      "EMŠO must be exactly 13 digits" => "EMŠO must contain only digits",
      "IČO must be exactly 8 digits" => "IČO must contain only digits",
      "TIN must be exactly 13 digits" => "TIN must contain only digits",
      "T.C. Kimlik number must be 11 digits" => {
        "T.C. Kimlik number must contain only digits"
      }
      "VKN must be 10 digits" => "VKN must contain only digits",
      "UBN must be exactly 8 digits" => "UBN must contain only digits",
      "EDRPOU must be exactly 8 digits" => "EDRPOU must contain only digits",
      "RUT must be 12 digits" => "RUT must contain only digits",
      "MST must be 10 or 13 digits" => "MST must contain only digits",
      "SA ID must be exactly 13 digits" => "SA ID must contain only digits",
      _ => "Identifier must contain only digits",
    };
    return Some(error("format", message));
  }
  None
}

fn validate_for(id: &str, raw: &str) -> ValidationResult {
  let value = compact_for(id, raw);
  match id {
    "ng.nin" => basic_shape(&value, &[11], "Nigerian NIN must be 11 digits")
      .unwrap_or(Ok(value)),
    "nl.kvk" => basic_shape(&value, &[8], "Dutch KvK number must be 8 digits")
      .unwrap_or(Ok(value)),
    "ph.philid" => {
      basic_shape(&value, &[12], "PhilID must be exactly 12 digits")
        .unwrap_or(Ok(value))
    }
    "nl.bsn" => validate_nl_bsn(value),
    "ni.ruc" => validate_ni_ruc(value),
    "no.fodselsnummer" => validate_no_fodselsnummer(value),
    "nz.ird" => validate_nz_ird(value),
    "pa.ruc" => validate_pa_ruc(&value),
    "pe.ruc" => validate_pe_ruc(value),
    "pk.cnic" => validate_pk_cnic(value),
    "pl.regon" => validate_pl_regon(value),
    "rs.pib" => validate_rs_pib(value),
    "ru.inn" => validate_ru_inn(value),
    "se.orgnr" => validate_se_orgnr(value),
    "se.vat" => validate_se_vat(value),
    "sg.uen" => validate_sg_uen(value),
    "si.emso" => validate_si_emso(value),
    "sk.ico" => validate_sk_ico(value),
    "sk.rc" => validate_sk_rc(value),
    "th.tin" => validate_th_tin(value),
    "tr.tckimlik" => validate_tr_tckimlik(value),
    "tr.vkn" => validate_tr_vkn(value),
    "tw.ubn" => validate_tw_ubn(value),
    "ua.edrpou" => validate_ua_edrpou(value),
    "us.itin" => validate_us_itin(value),
    "us.ssn" => validate_us_ssn(value),
    "uy.rut" => validate_uy_rut(value),
    "ve.rif" => validate_ve_rif(value),
    "vn.mst" => validate_vn_mst(value),
    "za.idnr" => validate_za_idnr(value),
    _ => error("format", "Unknown validator"),
  }
}

fn validate_nl_bsn(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[9], "BSN must be exactly 9 digits")
  {
    return result;
  }
  if value.chars().all(|ch| ch == '0') {
    return error("format", "BSN cannot be all zeros");
  }
  let weights = [9_i32, 8, 7, 6, 5, 4, 3, 2, -1];
  let sum: i32 = value
    .chars()
    .zip(weights)
    .map(|(ch, w)| i32::try_from(ch.to_digit(10).unwrap_or(0)).unwrap_or(0) * w)
    .sum();
  if sum.rem_euclid(11) != 0 {
    return error("checksum", "BSN check does not match");
  }
  Ok(value)
}

fn validate_ni_ruc(value: String) -> ValidationResult {
  if value.len() != 14 {
    return error("length", "Nicaragua RUC must be 14 characters");
  }
  if value.starts_with('J') {
    return if digits(span(&value, 1, 14)) {
      Ok(value)
    } else {
      error(
        "format",
        "Nicaragua legal entity RUC must be J followed by 13 digits",
      )
    };
  }
  let body = span(&value, 0, 13);
  if !digits(body) {
    return error("format", "Nicaragua RUC body must contain only digits");
  }
  let check = value.chars().nth(13).unwrap_or('\0');
  if !NI_CHECK_ALPHABET.contains(check) {
    return error("format", "Nicaragua RUC check letter is invalid");
  }
  let day = span(body, 3, 5).parse::<u32>().unwrap_or(0);
  let month = span(body, 5, 7).parse::<u32>().unwrap_or(0);
  if !(1..=31).contains(&day) || !(1..=12).contains(&month) {
    return error("component", "Nicaragua RUC contains an invalid birth date");
  }
  let remainder = body.bytes().fold(0_u32, |acc, byte| {
    (acc * 10 + u32::from(byte.saturating_sub(b'0'))) % 23
  });
  let expected = NI_CHECK_ALPHABET
    .chars()
    .nth(usize::try_from(remainder).unwrap_or(0))
    .unwrap_or('\0');
  if check != expected {
    return error("checksum", "Nicaragua RUC check letter does not match");
  }
  Ok(value)
}

fn norwegian_check(value: &str, weights: &[u32]) -> Option<u32> {
  let remainder = (11 - weighted(value, weights) % 11) % 11;
  (remainder != 10).then_some(remainder)
}

fn norwegian_parts(value: &str) -> Option<(i32, u32, u32, u32)> {
  let mut day = span(value, 0, 2).parse::<u32>().ok()?;
  let mut month = span(value, 2, 4).parse::<u32>().ok()?;
  let yy = span(value, 4, 6).parse::<u32>().ok()?;
  let individual = span(value, 6, 9).parse::<u32>().ok()?;
  if day > 40 {
    day = day.saturating_sub(40);
  }
  if month > 40 {
    month = month.saturating_sub(40);
  }
  let century = if individual <= 499 {
    1900
  } else if individual <= 749 && yy >= 54 {
    1800
  } else if individual <= 999 && yy < 40 {
    2000
  } else if individual >= 900 && yy >= 40 {
    1900
  } else {
    return None;
  };
  Some((century + i32::try_from(yy).ok()?, month, day, individual))
}

fn validate_no_fodselsnummer(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[11], "Norwegian birth number must be 11 digits")
  {
    return result;
  }
  if norwegian_check(&value, &[3, 7, 6, 1, 8, 9, 4, 5, 2])
    != Some(digit(&value, 9))
  {
    return error("checksum", "Norwegian birth number check digit 1 mismatch");
  }
  if norwegian_check(&value, &[5, 4, 3, 2, 7, 6, 5, 4, 3, 2])
    != Some(digit(&value, 10))
  {
    return error("checksum", "Norwegian birth number check digit 2 mismatch");
  }
  let Some((year, month, day, _)) = norwegian_parts(&value) else {
    return error(
      "component",
      "Norwegian birth number has invalid individual/century combination",
    );
  };
  if !valid_date(year, month, day) {
    return error(
      "component",
      "Norwegian birth number contains an invalid date",
    );
  }
  Ok(value)
}

fn ird_check(payload: &str) -> Option<u32> {
  let padded = format!("{payload:0>8}");
  let mut result =
    (11 - weighted(&padded, &[3, 2, 7, 6, 5, 4, 3, 2]) % 11) % 11;
  if result == 10 {
    result = (11 - weighted(&padded, &[7, 4, 3, 2, 5, 2, 7, 6]) % 11) % 11;
  }
  (result != 10).then_some(result)
}

fn validate_nz_ird(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[8, 9], "IRD number must be 8 or 9 digits")
  {
    return result;
  }
  let number = value.parse::<u32>().unwrap_or(0);
  if !(10_000_000..150_000_000).contains(&number) {
    return error("component", "IRD number out of valid range");
  }
  let payload = span(&value, 0, value.len().saturating_sub(1));
  let Some(check) = ird_check(payload) else {
    return error("component", "IRD number cannot have a valid check digit");
  };
  if check != digit(&value, value.len().saturating_sub(1)) {
    return error("checksum", "IRD check digit does not match");
  }
  Ok(value)
}

fn validate_pe_ruc(value: String) -> ValidationResult {
  if let Some(result) = basic_shape(&value, &[11], "RUC must be 11 digits") {
    return result;
  }
  if !matches!(span(&value, 0, 2), "10" | "15" | "17" | "20") {
    return error("component", "RUC has an invalid type prefix");
  }
  let sum = weighted(span(&value, 0, 10), &[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]);
  let mut check = 11 - sum % 11;
  if check >= 10 {
    check -= 10;
  }
  if check != digit(&value, 10) {
    return error("checksum", "RUC check digit does not match");
  }
  Ok(value)
}

fn validate_pk_cnic(value: String) -> ValidationResult {
  if let Some(result) = basic_shape(&value, &[13], "CNIC must be 13 digits") {
    return result;
  }
  if !matches!(value.chars().next(), Some('1'..='7')) {
    return error("component", "CNIC province code is invalid");
  }
  if value.ends_with('0') {
    return error("component", "CNIC gender digit must not be 0");
  }
  Ok(value)
}

fn validate_pl_regon(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[9, 14], "REGON must be 9 or 14 digits")
  {
    return result;
  }
  if weighted(span(&value, 0, 8), &[8, 9, 2, 3, 4, 5, 6, 7]) % 11 % 10
    != digit(&value, 8)
  {
    return error("checksum", "REGON check digit does not match");
  }
  if value.len() == 14
    && weighted(
      span(&value, 0, 13),
      &[2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8],
    ) % 11
      % 10
      != digit(&value, 13)
  {
    return error("checksum", "REGON local unit check digit mismatch");
  }
  Ok(value)
}

fn validate_rs_pib(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[9], "PIB must be exactly 9 digits")
  {
    return result;
  }
  let mut total = 10;
  for index in 0..8 {
    total = (total + digit(&value, index)) % 10;
    if total == 0 {
      total = 10;
    }
    total = (total * 2) % 11;
  }
  if (11 - total) % 10 != digit(&value, 8) {
    return error("checksum", "PIB check digit mismatch");
  }
  Ok(value)
}

fn inn_check(value: &str, weights: &[u32]) -> u32 {
  weighted(value, weights) % 11 % 10
}
fn validate_ru_inn(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[10, 12], "INN must be 10 or 12 digits")
  {
    return result;
  }
  let valid = if value.len() == 10 {
    inn_check(&value, &[2, 4, 10, 3, 5, 9, 4, 6, 8]) == digit(&value, 9)
  } else {
    inn_check(&value, &[7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) == digit(&value, 10)
      && inn_check(&value, &[3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
        == digit(&value, 11)
  };
  if !valid {
    return error("checksum", "INN check digit mismatch");
  }
  Ok(value)
}

fn validate_se_orgnr(value: String) -> ValidationResult {
  if let Some(result) = basic_shape(
    &value,
    &[10],
    "Swedish Organisationsnummer must be 10 digits",
  ) {
    return result;
  }
  if !luhn_ok(&value) {
    return error("checksum", "Swedish Organisationsnummer Luhn check failed");
  }
  Ok(value)
}

fn validate_se_vat(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[12], "Swedish VAT number must be 12 digits")
  {
    return result;
  }
  if !value.ends_with("01") {
    return error("component", "Swedish VAT number must end with 01");
  }
  if !luhn_ok(span(&value, 0, 10)) {
    return error("checksum", "Swedish VAT number Luhn check failed");
  }
  Ok(value)
}

fn alpha_char(value: &str, index: usize) -> char {
  value.chars().nth(index).unwrap_or('\0')
}
fn validate_sg_uen(value: String) -> ValidationResult {
  if !matches!(value.len(), 9 | 10) {
    return error("length", "UEN must be 9 or 10 characters");
  }
  if !value
    .chars()
    .all(|ch| ch.is_ascii_uppercase() || ch.is_ascii_digit())
  {
    return error("format", "UEN must contain only digits and letters");
  }
  if value.len() == 9 {
    if !digits(span(&value, 0, 8))
      || !alpha_char(&value, 8).is_ascii_uppercase()
    {
      return error("format", "Business UEN must start with 8 digits");
    }
    let alpha = "XMKECAWLJDB";
    let expected = alpha
      .chars()
      .nth(
        usize::try_from(weighted(&value, &[10, 4, 9, 3, 8, 2, 7, 1]) % 11)
          .unwrap_or(0),
      )
      .unwrap_or('\0');
    if alpha_char(&value, 8) != expected {
      return error("checksum", "UEN check letter does not match");
    }
    return Ok(value);
  }
  if alpha_char(&value, 0).is_ascii_digit() {
    if !digits(span(&value, 0, 9))
      || !alpha_char(&value, 9).is_ascii_uppercase()
    {
      return error("format", "Company UEN must have 9 digits");
    }
    let alpha = "ZKCMDNERGWH";
    let expected = alpha
      .chars()
      .nth(
        usize::try_from(weighted(&value, &[10, 8, 6, 4, 9, 7, 5, 3, 1]) % 11)
          .unwrap_or(0),
      )
      .unwrap_or('\0');
    if alpha_char(&value, 9) != expected {
      return error("checksum", "UEN check letter does not match");
    }
    return Ok(value);
  }
  if !matches!(alpha_char(&value, 0), 'R' | 'S' | 'T') {
    return error("component", "Other UEN must start with R, S, or T");
  }
  if !digits(span(&value, 1, 3)) || !digits(span(&value, 5, 9)) {
    return error("format", "Other UEN numeric positions must be digits");
  }
  if !SG_ENTITY_TYPES.contains(&span(&value, 3, 5)) {
    return error("component", "Unknown UEN entity type");
  }
  let alpha = "ABCDEFGHJKLMNPQRSTUVWX0123456789";
  let weights = [4_i32, 3, 5, 3, 10, 2, 2, 5, 7];
  let sum: i32 = value
    .chars()
    .take(9)
    .zip(weights)
    .map(|(ch, w)| i32::try_from(alpha.find(ch).unwrap_or(0)).unwrap_or(0) * w)
    .sum();
  let expected = alpha
    .chars()
    .nth(usize::try_from((sum - 5).rem_euclid(11)).unwrap_or(0))
    .unwrap_or('\0');
  if alpha_char(&value, 9) != expected {
    return error("checksum", "UEN check letter does not match");
  }
  Ok(value)
}

fn emso_date(value: &str) -> Option<(i32, u32, u32, u32)> {
  let day = span(value, 0, 2).parse().ok()?;
  let month = span(value, 2, 4).parse().ok()?;
  let raw = span(value, 4, 7).parse::<i32>().ok()?;
  let year = if raw < 900 { raw + 2000 } else { raw + 1000 };
  let serial = span(value, 9, 12).parse().ok()?;
  Some((year, month, day, serial))
}
fn validate_si_emso(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[13], "EMŠO must be exactly 13 digits")
  {
    return result;
  }
  let Some((year, month, day, _)) = emso_date(&value) else {
    return error("component", "EMŠO contains an invalid date");
  };
  if !valid_date(year, month, day) {
    return error("component", "EMŠO contains an invalid date");
  }
  let register = span(&value, 7, 9).parse::<u32>().unwrap_or(0);
  if !(50..=59).contains(&register) {
    return error("component", "EMSO register code must be between 50 and 59");
  }
  let total =
    weighted(span(&value, 0, 12), &[7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]) % 11;
  let check = (11 - total) % 11 % 10;
  if check != digit(&value, 12) {
    return error("checksum", "EMŠO check digit does not match");
  }
  Ok(value)
}

fn validate_sk_ico(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[8], "IČO must be exactly 8 digits")
  {
    return result;
  }
  let check =
    (11 - weighted(span(&value, 0, 7), &[8, 7, 6, 5, 4, 3, 2]) % 11) % 10;
  if check != digit(&value, 7) {
    return error("checksum", "IČO check digit does not match");
  }
  Ok(value)
}

fn validate_sk_rc(value: String) -> ValidationResult {
  if !matches!(value.len(), 9 | 10) {
    return error("length", "Birth number must be 9 or 10 digits");
  }
  if !digits(&value) {
    return error("format", "Birth number must contain only digits");
  }
  let mut year = i32::try_from(
    digit(span(&value, 0, 2), 0) * 10 + digit(span(&value, 0, 2), 1),
  )
  .unwrap_or(0)
    + 1900;
  if value.len() == 9 {
    if year >= 1980 {
      year -= 100;
    }
    if year > 1953 {
      return error("component", "9-digit birth numbers are pre-1954 only");
    }
  } else if year < 1954 {
    year += 100;
  }
  let raw_month = span(&value, 2, 4).parse::<u32>().unwrap_or(0);
  let offsets: &[u32] = if value.len() == 10 && year >= 2004 {
    &[0, 50, 20, 70]
  } else {
    &[0, 50]
  };
  let Some(month) = offsets.iter().find_map(|offset| {
    raw_month
      .checked_sub(*offset)
      .filter(|month| (1..=12).contains(month))
  }) else {
    return error("component", "Birth number contains an invalid month");
  };
  let day = span(&value, 4, 6).parse::<u32>().unwrap_or(0);
  if !(1..=31).contains(&day) {
    return error("component", "Birth number contains an invalid day");
  }
  if !valid_date(year, month, day) {
    return error("component", "Birth number contains an invalid date");
  }
  if value.len() == 10 {
    let front = span(&value, 0, 9).parse::<u64>().unwrap_or(0);
    if u32::try_from(front % 11 % 10).unwrap_or(0) != digit(&value, 9) {
      return error("checksum", "Birth number is not divisible by 11");
    }
  }
  Ok(value)
}

fn validate_th_tin(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[13], "TIN must be exactly 13 digits")
  {
    return result;
  }
  if digit(&value, 0) > 8 {
    return error("component", "TIN first digit must be 0-8");
  }
  let weights = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let check = (11 - weighted(span(&value, 0, 12), &weights) % 11) % 10;
  if check != digit(&value, 12) {
    return error("checksum", "TIN check digit does not match");
  }
  Ok(value)
}

fn tc_checks(value: &str) -> (u32, u32) {
  let odd: u32 = (0..9).step_by(2).map(|index| digit(value, index)).sum();
  let even: u32 = (1..9).step_by(2).map(|index| digit(value, index)).sum();
  let tenth = (7 * odd + 10 - even % 10) % 10;
  (tenth, (odd + even + tenth) % 10)
}
fn validate_tr_tckimlik(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[11], "T.C. Kimlik number must be 11 digits")
  {
    return result;
  }
  if value.starts_with('0') {
    return error("component", "T.C. Kimlik number cannot start with 0");
  }
  let (a, b) = tc_checks(&value);
  if a != digit(&value, 9) || b != digit(&value, 10) {
    return error("checksum", "T.C. Kimlik number check digit mismatch");
  }
  Ok(value)
}

fn vkn_check(value: &str) -> u32 {
  let mut sum = 0;
  for index in 0..9 {
    let position = 9_u32.saturating_sub(u32::try_from(index).unwrap_or(0));
    let first = (digit(value, index) + position) % 10;
    if first != 0 {
      let second = (first * 2_u32.pow(position)) % 9;
      sum += if second == 0 { 9 } else { second };
    }
  }
  (10 - sum % 10) % 10
}
fn validate_tr_vkn(value: String) -> ValidationResult {
  if let Some(result) = basic_shape(&value, &[10], "VKN must be 10 digits") {
    return result;
  }
  if vkn_check(&value) != digit(&value, 9) {
    return error("checksum", "VKN check digit mismatch");
  }
  Ok(value)
}

fn validate_tw_ubn(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[8], "UBN must be exactly 8 digits")
  {
    return result;
  }
  let sum: u32 = [1, 2, 1, 2, 1, 2, 4, 1]
    .into_iter()
    .enumerate()
    .map(|(index, weight)| {
      let product = digit(&value, index) * weight;
      product.div_euclid(10) + product.rem_euclid(10)
    })
    .sum();
  let check = sum % 10;
  if check != 0 && !(check == 9 && digit(&value, 6) == 7) {
    return error("checksum", "UBN checksum does not match");
  }
  Ok(value)
}

fn edrpou_sum(value: &str, weights: &[u32]) -> u32 {
  weighted(span(value, 0, 7), weights) % 11
}
fn validate_ua_edrpou(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[8], "EDRPOU must be exactly 8 digits")
  {
    return result;
  }
  let group_a = digit(&value, 0) < 3 || digit(&value, 0) >= 6;
  let mut check = edrpou_sum(
    &value,
    if group_a {
      &[1, 2, 3, 4, 5, 6, 7]
    } else {
      &[7, 1, 2, 3, 4, 5, 6]
    },
  );
  if check >= 10 {
    check = edrpou_sum(
      &value,
      if group_a {
        &[3, 4, 5, 6, 7, 8, 9]
      } else {
        &[9, 3, 4, 5, 6, 7, 8]
      },
    ) % 10;
  }
  if check != digit(&value, 7) {
    return error("checksum", "EDRPOU check digit mismatch");
  }
  Ok(value)
}

fn validate_us_itin(value: String) -> ValidationResult {
  if !digits(&value) {
    return error("format", "ITIN must contain only digits");
  }
  if value.len() != 9 {
    return error("length", "ITIN must be 9 digits");
  }
  if !value.starts_with('9') {
    return error("component", "ITIN area must start with 9");
  }
  let group = span(&value, 3, 5).parse::<u32>().unwrap_or(0);
  if !(70..=99).contains(&group) || matches!(group, 89 | 93) {
    return error(
      "component",
      "ITIN group digits are not in the allowed range (70-99 excl. 89, 93)",
    );
  }
  Ok(value)
}

fn validate_us_ssn(value: String) -> ValidationResult {
  if !digits(&value) {
    return error("format", "SSN must contain only digits");
  }
  if value.len() != 9 {
    return error("length", "SSN must be 9 digits");
  }
  let area = span(&value, 0, 3);
  if area == "000" || area == "666" || area.starts_with('9') {
    return error("component", "SSN area number is invalid");
  }
  if span(&value, 3, 5) == "00" {
    return error("component", "SSN group number cannot be 00");
  }
  if span(&value, 5, 9) == "0000" {
    return error("component", "SSN serial number cannot be 0000");
  }
  if matches!(value.as_str(), "078051120" | "457555462" | "219099999") {
    return error("component", "SSN is on the blacklist");
  }
  Ok(value)
}

fn validate_uy_rut(value: String) -> ValidationResult {
  if let Some(result) = basic_shape(&value, &[12], "RUT must be 12 digits") {
    return result;
  }
  let document = span(&value, 0, 2).parse::<u32>().unwrap_or(0);
  if !(1..=22).contains(&document) {
    return error("component", "RUT document type must be between 01 and 22");
  }
  if span(&value, 2, 8) == "000000" {
    return error("component", "RUT sequence must not be all zeros");
  }
  if span(&value, 8, 11) != "001" {
    return error("component", "RUT branch code must be 001");
  }
  let check = (11
    - weighted(span(&value, 0, 11), &[4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11)
    % 11;
  if check == 10 || check != digit(&value, 11) {
    return error("checksum", "RUT check digit does not match");
  }
  Ok(value)
}

const fn rif_prefix(prefix: char) -> Option<u32> {
  match prefix {
    'V' => Some(4),
    'E' => Some(8),
    'J' => Some(12),
    'P' => Some(16),
    'G' => Some(20),
    _ => None,
  }
}
fn validate_ve_rif(value: String) -> ValidationResult {
  if value.len() != 10 {
    return error("length", "RIF must be 10 characters");
  }
  let prefix = alpha_char(&value, 0);
  let Some(offset) = rif_prefix(prefix) else {
    return error("component", "RIF must start with V, E, J, P, or G");
  };
  if !digits(span(&value, 1, 10)) {
    return error("format", "RIF body must contain only digits");
  }
  let lookup = "00987654321";
  let index = (offset
    + weighted(span(&value, 1, 9), &[3, 2, 7, 6, 5, 4, 3, 2]) % 11)
    % 11;
  let expected = lookup
    .chars()
    .nth(usize::try_from(index).unwrap_or(0))
    .unwrap_or('\0');
  if alpha_char(&value, 9) != expected {
    return error("checksum", "RIF check digit does not match");
  }
  Ok(value)
}

fn validate_vn_mst(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[10, 13], "MST must be 10 or 13 digits")
  {
    return result;
  }
  if span(&value, 2, 9) == "0000000" {
    return error("component", "MST sequential part must not be 0000000");
  }
  if value.len() == 13 && span(&value, 10, 13) == "000" {
    return error("component", "MST branch suffix must not be 000");
  }
  let check =
    10 - weighted(span(&value, 0, 9), &[31, 29, 23, 19, 17, 13, 7, 5, 3]) % 11;
  if check > 9 || check != digit(&value, 9) {
    return error("checksum", "MST check digit does not match");
  }
  Ok(value)
}

fn south_africa_date(value: &str) -> Option<(i32, u32, u32)> {
  let current = i32::try_from(crate::current_year()).ok()?;
  let yy = span(value, 0, 2).parse::<i32>().ok()?;
  let mut year = current - current.rem_euclid(100) + yy;
  if year > current {
    year -= 100;
  }
  Some((
    year,
    span(value, 2, 4).parse().ok()?,
    span(value, 4, 6).parse().ok()?,
  ))
}
fn validate_za_idnr(value: String) -> ValidationResult {
  if let Some(result) =
    basic_shape(&value, &[13], "SA ID must be exactly 13 digits")
  {
    return result;
  }
  let Some((year, month, day)) = south_africa_date(&value) else {
    return error("component", "SA ID contains an invalid date of birth");
  };
  if !valid_date(year, month, day) {
    return error("component", "SA ID contains an invalid date of birth");
  }
  if !matches!(alpha_char(&value, 10), '0' | '1') {
    return error("component", "SA ID citizenship digit must be 0 or 1");
  }
  if !luhn_ok(&value) {
    return error("checksum", "SA ID Luhn check digit mismatch");
  }
  Ok(value)
}

fn pad_left(value: &str, length: usize) -> String {
  format!("{value:0>length$}")
}
fn pa_digit_dv(value: &str, old: bool) -> u32 {
  let mut weight = 2;
  let mut sum = 0;
  for ch in value.chars().rev() {
    if old && weight == 12 {
      weight += 1;
    }
    sum += weight * ch.to_digit(10).unwrap_or(0);
    weight += 1;
  }
  let rem = sum % 11;
  if rem > 1 { 11 - rem } else { 0 }
}
fn pa_legacy(code: &str) -> &str {
  match code {
    "10" | "19" | "34" | "43" => "01",
    "11" | "20" | "26" | "35" | "44" => "02",
    "12" | "21" | "27" | "36" | "45" => "03",
    "13" | "22" | "28" | "37" | "46" => "04",
    "14" | "29" | "38" | "47" => "05",
    "15" | "30" | "39" | "48" => "06",
    "16" | "23" | "31" | "40" | "49" => "07",
    "17" | "24" | "32" | "41" => "08",
    "18" | "25" | "33" | "42" => "09",
    _ => code,
  }
}
fn pa_dv(parts: &[&str]) -> Option<String> {
  if parts.len() != 3 || parts.iter().any(|part| !digits(part)) {
    return None;
  }
  let [first_part, second_part, third_part] = parts else {
    return None;
  };
  let mut old = false;
  let mut buffer = if first_part.len() <= 2 {
    format!(
      "{}0000005{}00{}{}",
      "0".repeat(4_usize.saturating_sub(second_part.len())),
      pad_left(first_part, 2),
      pad_left(second_part, 3),
      pad_left(third_part, 5)
    )
  } else {
    let result = format!(
      "{}{}{}",
      pad_left(first_part, 10),
      pad_left(second_part, 4),
      pad_left(third_part, 6)
    );
    old = result.get(3..5) == Some("00")
      && result.chars().nth(5).is_some_and(|ch| ch < '5');
    result
  };
  if old {
    let code = buffer.get(5..7)?;
    let mapped = pa_legacy(code).to_owned();
    buffer.replace_range(5..7, &mapped);
  }
  let first = pa_digit_dv(&buffer, old);
  let second = pa_digit_dv(&format!("{buffer}{first}"), old);
  Some(format!("{first}{second}"))
}
fn validate_pa_ruc(value: &str) -> ValidationResult {
  let normalized = value.replace("DV:", "DV");
  let Some(position) = normalized.rfind("DV") else {
    return error("format", "Panama RUC must include DV (dígito verificador)");
  };
  let left = normalized
    .get(..position)
    .unwrap_or("")
    .trim()
    .trim_end_matches('-');
  let check = normalized.get(position + 2..).unwrap_or("").trim();
  if check.len() != 2 || !digits(check) {
    return error("format", "Panama RUC must include DV (dígito verificador)");
  }
  let parts = left.split('-').collect::<Vec<_>>();
  if parts.len() < 3
    || parts.len() > 4
    || parts.iter().any(|part| part.is_empty())
  {
    return error(
      "format",
      "Panama RUC must have 3–4 hyphen-separated segments",
    );
  }
  let Some(expected) = pa_dv(&parts) else {
    return error("format", "Unrecognized Panama RUC format");
  };
  if expected != check {
    return error("checksum", "Panama RUC dígito verificador does not match");
  }
  Ok(format!("{} DV{}", parts.join("-"), check))
}

fn parse_for(id: &str, value: &str) -> Option<ParsedIdentifier> {
  let compact = validate_for(id, value).ok()?;
  match id {
    "no.fodselsnummer" => {
      let (year, month, day, individual) = norwegian_parts(&compact)?;
      Some(ParsedIdentifier {
        birth_date: IsoDate {
          year,
          month: u8::try_from(month).ok()?,
          day: u8::try_from(day).ok()?,
        },
        gender: Some(if individual % 2 == 0 {
          Gender::Female
        } else {
          Gender::Male
        }),
      })
    }
    "si.emso" => {
      let (year, month, day, serial) = emso_date(&compact)?;
      Some(ParsedIdentifier {
        birth_date: IsoDate {
          year,
          month: u8::try_from(month).ok()?,
          day: u8::try_from(day).ok()?,
        },
        gender: Some(if serial < 500 {
          Gender::Male
        } else {
          Gender::Female
        }),
      })
    }
    "sk.rc" => crate::validators::legacy_specs::cz_rc::parse(&compact),
    "za.idnr" => {
      let (year, month, day) = south_africa_date(&compact)?;
      let serial = span(&compact, 6, 10).parse::<u32>().ok()?;
      Some(ParsedIdentifier {
        birth_date: IsoDate {
          year,
          month: u8::try_from(month).ok()?,
          day: u8::try_from(day).ok()?,
        },
        gender: Some(if serial < 5000 {
          Gender::Female
        } else {
          Gender::Male
        }),
      })
    }
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn vietnam_mst_rejects_two_digit_check_values() {
    assert!(validate_vn_mst("9765357360".to_owned()).is_err());
  }

  #[test]
  fn catalog_examples_and_generated_values_are_valid() {
    for validator in VALIDATORS {
      for example in validator.examples() {
        assert!(
          validator.validate(example).is_ok(),
          "{} rejected example {example}",
          validator.id()
        );
      }
      let generated = validator.generate();
      assert!(
        generated
          .as_deref()
          .is_some_and(|value| validator.validate(value).is_ok()),
        "{} generated an invalid value",
        validator.id()
      );
    }
  }

  #[test]
  fn personal_identifiers_preserve_parsed_fields() {
    let parsed = no_fodselsnummer::parse("15108695088");
    assert_eq!(parsed.map(|value| value.birth_date.year), Some(1986));

    let south_african = za_idnr::parse("7503305044089");
    assert_eq!(
      south_african.and_then(|value| value.gender),
      Some(Gender::Male)
    );
  }
}

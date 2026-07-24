//! Full-surface specifications for validators previously implemented as boolean-only helpers.

#![allow(
  clippy::arithmetic_side_effects,
  clippy::collapsible_if,
  clippy::indexing_slicing,
  clippy::match_same_arms,
  clippy::shadow_unrelated,
  clippy::too_many_lines
)]

use crate::types::{
  CanonicalValidation, CountryCode, EntityType, Gender, IsoDate,
  ParsedIdentifier, ValidationError, ValidationResult, Validator,
  ValidatorScope, ValidatorSpec,
};

macro_rules! canonical_validator {
  ("pl.nip", $validator:expr) => {
    $validator.with_canonical_validator(validate_pl_nip_canonical)
  };
  ($id:literal, $validator:expr) => {
    $validator
  };
}

macro_rules! legacy_validator {
  ($module:ident, $id:tt, $name:literal, $local_name:literal, $abbreviation:literal, $aliases:expr, $pattern:literal, $scope:expr, $entity:expr, $source:expr, $lengths:expr, $examples:expr, $generate:expr, $parse:expr) => {
    pub mod $module {
      use super::*;
      pub static VALIDATOR: Validator = canonical_validator!(
        $id,
        Validator::new(ValidatorSpec {
          id: $id,
          name: $name,
          local_name: $local_name,
          abbreviation: $abbreviation,
          aliases: $aliases,
          candidate_pattern: $pattern,
          scope: $scope,
          entity_type: $entity,
          source_url: $source,
          lengths: $lengths,
          examples: $examples,
          compact,
          format,
          validate,
          generate: $generate,
          parse: $parse,
        })
      );
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
        generate_for($id, $examples[0])
      }
      #[must_use]
      pub fn parse(value: &str) -> Option<ParsedIdentifier> {
        parse_for($id, value)
      }
    }
  };
}

legacy_validator!(
  at_tin,
  "at.tin",
  "Austrian Tax Identification Number",
  "Abgabenkontonummer",
  "TIN",
  &["Steuernummer", "St.Nr.", "TIN"],
  "\\d{2}-?\\d{3}/\\d{4}",
  ValidatorScope::Country(CountryCode::At),
  EntityType::Any,
  Some("https://de.wikipedia.org/wiki/Abgabenkontonummer"),
  &[],
  &["591199013"],
  Some(generate),
  None
);
legacy_validator!(
  at_uid,
  "at.uid",
  "Austrian VAT Number",
  "Umsatzsteuer-Identifikationsnummer",
  "UID",
  &["UID", "Umsatzsteuer-Identifikationsnummer", "ATU"],
  "ATU\\d{8}",
  ValidatorScope::Country(CountryCode::At),
  EntityType::Company,
  Some("https://www.bmf.gv.at/"),
  &[],
  &["U13585627"],
  Some(generate),
  None
);
legacy_validator!(
  au_acn,
  "au.acn",
  "Australian Company Number",
  "Australian Company Number",
  "ACN",
  &["ACN", "Australian Company Number"],
  "\\d{3}\\s?\\d{3}\\s?\\d{3}",
  ValidatorScope::Country(CountryCode::Au),
  EntityType::Company,
  Some("https://asic.gov.au/"),
  &[],
  &["004085616", "010499966"],
  Some(generate),
  None
);
legacy_validator!(
  be_nn,
  "be.nn",
  "Belgian National Number",
  "Numéro national",
  "NN",
  &["rijksregisternummer", "numéro national", "NN"],
  "\\d{2}\\.?\\d{2}\\.?\\d{2}-?\\d{3}\\.?\\d{2}",
  ValidatorScope::Country(CountryCode::Be),
  EntityType::Person,
  Some("https://www.ibz.rrn.fgov.be/"),
  &[],
  &["93051822361"],
  Some(generate),
  None
);
legacy_validator!(
  be_vat,
  "be.vat",
  "Belgian VAT Number",
  "BTW-identificatienummer",
  "BTW",
  &["BTW", "TVA", "numéro d'entreprise", "ondernemingsnummer"],
  "BE0?\\d{9,10}",
  ValidatorScope::Country(CountryCode::Be),
  EntityType::Company,
  Some("https://finances.belgium.be/"),
  &[],
  &["0776091951"],
  Some(generate),
  None
);
legacy_validator!(
  bg_vat,
  "bg.vat",
  "Bulgarian VAT Number",
  "ИН по ДДС",
  "ИН по ДДС",
  &["ДДС", "идентификационен номер по ДДС"],
  "BG\\d{9,10}",
  ValidatorScope::Country(CountryCode::Bg),
  EntityType::Any,
  Some("https://www.nra.bg/"),
  &[9, 10],
  &["175074752"],
  Some(generate),
  None
);
legacy_validator!(
  br_cnpj,
  "br.cnpj",
  "Brazilian CNPJ",
  "Cadastro Nacional da Pessoa Jurídica",
  "CNPJ",
  &["CNPJ", "Cadastro Nacional da Pessoa Jurídica"],
  "\\d{2}\\.?\\d{3}\\.?\\d{3}/?\\d{4}-?\\d{2}",
  ValidatorScope::Country(CountryCode::Br),
  EntityType::Company,
  Some("https://www.gov.br/receitafederal/"),
  &[],
  &["33000167000101", "00000000000191"],
  Some(generate),
  None
);
legacy_validator!(
  ch_uid,
  "ch.uid",
  "Swiss Business ID",
  "Unternehmens-Identifikationsnummer",
  "UID",
  &["Unternehmens-Identifikationsnummer", "UID", "IDE"],
  "CHE-?\\d{3}\\.?\\d{3}\\.?\\d{3}",
  ValidatorScope::Country(CountryCode::Ch),
  EntityType::Company,
  Some("https://www.uid.admin.ch/"),
  &[],
  &["CHE100155212"],
  Some(generate),
  None
);
legacy_validator!(
  cn_ric,
  "cn.ric",
  "Chinese Resident Identity Card",
  "居民身份证号码",
  "RIC",
  &["身份证", "居民身份证号码", "RIC"],
  "\\d{17}[\\dX]",
  ValidatorScope::Country(CountryCode::Cn),
  EntityType::Person,
  Some("https://en.wikipedia.org/wiki/Resident_Identity_Card"),
  &[15, 18],
  &["11010519491231002X", "440524188001010014"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  cy_vat,
  "cy.vat",
  "Cypriot VAT Number",
  "Αριθμός Εγγραφής Φ.Π.Α.",
  "ΦΠΑ",
  &["ΦΠΑ", "VAT CY"],
  "CY\\d{8}[A-Z]",
  ValidatorScope::Country(CountryCode::Cy),
  EntityType::Company,
  Some("https://www.mof.gov.cy/"),
  &[],
  &["10259033P"],
  Some(generate),
  None
);
legacy_validator!(
  cz_dic,
  "cz.dic",
  "Czech VAT Number",
  "Daňové identifikační číslo",
  "DIČ",
  &["DIČ", "daňové identifikační číslo"],
  "CZ\\d{8,10}",
  ValidatorScope::Country(CountryCode::Cz),
  EntityType::Any,
  Some("https://adisspr.mfcr.cz/dpr/DphReg"),
  &[8, 9, 10],
  &["25123891", "7103192745"],
  Some(generate),
  None
);
legacy_validator!(
  cz_rc,
  "cz.rc",
  "Czech Birth Number",
  "Rodné číslo",
  "RČ",
  &["rodné číslo", "RČ", "birth number"],
  "\\d{6}/\\d{3,4}",
  ValidatorScope::Country(CountryCode::Cz),
  EntityType::Person,
  Some("https://www.mvcr.cz/mvcren/docDetail.aspx?docid=21975362&doctype=ART"),
  &[9, 10],
  &["7103192745"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  de_idnr,
  "de.idnr",
  "German Tax ID",
  "Steuerliche Identifikationsnummer",
  "IdNr",
  &["Steuerliche Identifikationsnummer", "IdNr", "Steuer-ID"],
  "\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}",
  ValidatorScope::Country(CountryCode::De),
  EntityType::Person,
  Some(
    "https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html"
  ),
  &[],
  &["36574261809"],
  Some(generate),
  None
);
legacy_validator!(
  de_stnr,
  "de.stnr",
  "German Tax Number",
  "Steuernummer",
  "StNr",
  &["Steuernummer", "St.Nr."],
  "\\d{2,4}/\\d{3,4}/\\d{4,5}",
  ValidatorScope::Country(CountryCode::De),
  EntityType::Any,
  Some("https://de.wikipedia.org/wiki/Steuernummer"),
  &[10, 11, 13],
  &["2181508150", "18181508155"],
  Some(generate),
  None
);
legacy_validator!(
  de_svnr,
  "de.svnr",
  "German Social Insurance Number",
  "Sozialversicherungsnummer",
  "SVNR",
  &["Sozialversicherungsnummer", "SVNR", "Versicherungsnummer"],
  "\\d{2}\\s?\\d{6}\\s?[A-Z]\\s?\\d{3}",
  ValidatorScope::Country(CountryCode::De),
  EntityType::Person,
  Some("https://de.wikipedia.org/wiki/Sozialversicherungsnummer"),
  &[12],
  &["12010188M011"],
  Some(generate),
  None
);
legacy_validator!(
  de_vat,
  "de.vat",
  "German VAT Number",
  "Umsatzsteuer-Identifikationsnummer",
  "USt-IdNr.",
  &["USt-IdNr", "Umsatzsteuer-Identifikationsnummer", "VAT DE"],
  "DE\\d{9}",
  ValidatorScope::Country(CountryCode::De),
  EntityType::Company,
  Some(
    "https://www.bzst.de/DE/Unternehmen/Identifikationsnummern/Umsatzsteuer-Identifikationsnummer/umsatzsteuer-identifikationsnummer_node.html"
  ),
  &[9],
  &["136695976"],
  Some(generate),
  None
);
legacy_validator!(
  dk_cpr,
  "dk.cpr",
  "Danish Personal ID",
  "Det Centrale Personregister",
  "CPR",
  &["CPR-nummer", "personnummer", "CPR"],
  "\\d{6}-?\\d{4}",
  ValidatorScope::Country(CountryCode::Dk),
  EntityType::Person,
  Some("https://cpr.dk/"),
  &[10],
  &["2110625629"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  dk_vat,
  "dk.vat",
  "Danish VAT Number",
  "Momsregistreringsnummer",
  "CVR",
  &["momsnummer", "SE-nummer"],
  "DK\\d{8}",
  ValidatorScope::Country(CountryCode::Dk),
  EntityType::Company,
  Some("https://erhvervsstyrelsen.dk/"),
  &[8],
  &["13585628"],
  Some(generate),
  None
);
legacy_validator!(
  ee_ik,
  "ee.ik",
  "Estonian Personal ID",
  "Isikukood",
  "IK",
  &["isikukood", "IK"],
  "[1-6]\\d{10}",
  ValidatorScope::Country(CountryCode::Ee),
  EntityType::Person,
  Some("https://www.riigiteataja.ee/en/eli/512012015003/consolide"),
  &[],
  &["36805280109"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  ee_vat,
  "ee.vat",
  "Estonian VAT Number",
  "Käibemaksukohustuslase number",
  "KMKR",
  &["käibemaksukohustuslase number", "KMKR"],
  "EE\\d{9}",
  ValidatorScope::Country(CountryCode::Ee),
  EntityType::Company,
  Some("https://www.emta.ee/en"),
  &[],
  &["100931558"],
  Some(generate),
  None
);
legacy_validator!(
  es_cif,
  "es.cif",
  "Spanish Company Tax ID",
  "Código de Identificación Fiscal",
  "CIF",
  &["CIF", "código de identificación fiscal"],
  "[A-HJNP-SUVW]\\d{7}[\\dA-J]",
  ValidatorScope::Country(CountryCode::Es),
  EntityType::Company,
  Some("https://www.agenciatributaria.es/"),
  &[],
  &["A13585625"],
  Some(generate),
  None
);
legacy_validator!(
  es_nie,
  "es.nie",
  "Spanish Foreigner ID",
  "Número de Identidad de Extranjero",
  "NIE",
  &["N.I.E.", "NIE", "número de identidad de extranjero"],
  "[XYZ]-?\\d{7}-?[A-Z]",
  ValidatorScope::Country(CountryCode::Es),
  EntityType::Person,
  Some(
    "https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/nie/"
  ),
  &[],
  &["X5253868R"],
  Some(generate),
  None
);
legacy_validator!(
  es_nss,
  "es.nss",
  "Spanish Social Security Number",
  "Número de la Seguridad Social",
  "NSS",
  &["NSS", "número de seguridad social"],
  "\\d{12}",
  ValidatorScope::Country(CountryCode::Es),
  EntityType::Person,
  Some("https://www.seg-social.es/"),
  &[12],
  &["281234567840"],
  Some(generate),
  None
);
legacy_validator!(
  es_vat,
  "es.vat",
  "Spanish VAT Number",
  "Número de Identificación Fiscal",
  "NIF",
  &["NIF", "CIF", "número de identificación fiscal"],
  "ES[A-Z]\\d{7}[A-Z\\d]",
  ValidatorScope::Country(CountryCode::Es),
  EntityType::Any,
  Some("https://www.agenciatributaria.es/"),
  &[],
  &["12345678Z", "A78304516"],
  Some(generate),
  None
);
legacy_validator!(
  fi_hetu,
  "fi.hetu",
  "Finnish Personal ID",
  "Henkilötunnus",
  "HETU",
  &["henkilötunnus", "HETU", "sosiaaliturvatunnus"],
  "\\d{6}[-+A]\\d{3}[\\dA-Z]",
  ValidatorScope::Country(CountryCode::Fi),
  EntityType::Person,
  Some("https://dvv.fi/en/personal-identity-code"),
  &[11],
  &["131052-308T"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  fi_vat,
  "fi.vat",
  "Finnish VAT Number",
  "Arvonlisäveronumero",
  "ALV nro",
  &["ALV-numero", "Y-tunnus"],
  "FI\\d{8}",
  ValidatorScope::Country(CountryCode::Fi),
  EntityType::Company,
  Some("https://www.ytj.fi/en/index/businessid.html"),
  &[8],
  &["20774740"],
  Some(generate),
  None
);
legacy_validator!(
  fi_ytunnus,
  "fi.ytunnus",
  "Finnish Business ID",
  "Y-tunnus",
  "Y-tunnus",
  &["Y-tunnus", "yritystunnus", "FO-nummer"],
  "\\d{7}-\\d",
  ValidatorScope::Country(CountryCode::Fi),
  EntityType::Company,
  Some("https://www.ytj.fi/en/index/businessid.html"),
  &[],
  &["20774740"],
  Some(generate),
  None
);
legacy_validator!(
  fr_nir,
  "fr.nir",
  "French Social Security Number",
  "Numero d'Inscription au Repertoire",
  "NIR",
  &["NIR", "numéro de sécurité sociale", "numéro SS", "sécu"],
  "[12]\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{2}",
  ValidatorScope::Country(CountryCode::Fr),
  EntityType::Person,
  Some("https://en.wikipedia.org/wiki/INSEE_code"),
  &[15],
  &["295117823456784"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  fr_siren,
  "fr.siren",
  "French Company ID",
  "Système d'Identification du Répertoire des Entreprises",
  "SIREN",
  &["SIREN", "numéro SIREN"],
  "\\d{3}\\s?\\d{3}\\s?\\d{3}",
  ValidatorScope::Country(CountryCode::Fr),
  EntityType::Company,
  Some("https://www.insee.fr/fr/information/2549588"),
  &[],
  &["552008443"],
  Some(generate),
  None
);
legacy_validator!(
  fr_siret,
  "fr.siret",
  "French Establishment ID",
  "Système d'Identification du Répertoire des Établissements",
  "SIRET",
  &["SIRET", "numéro SIRET"],
  "\\d{3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{5}",
  ValidatorScope::Country(CountryCode::Fr),
  EntityType::Company,
  Some("https://www.insee.fr/fr/information/2549588"),
  &[],
  &["73282932000074"],
  Some(generate),
  None
);
legacy_validator!(
  fr_tva,
  "fr.tva",
  "French VAT Number",
  "Numéro de TVA intracommunautaire",
  "TVA",
  &["numéro de TVA", "TVA intracommunautaire", "FR VAT"],
  "FR[A-Z0-9]{2}\\d{9}",
  ValidatorScope::Country(CountryCode::Fr),
  EntityType::Company,
  Some("https://www.economie.gouv.fr/"),
  &[],
  &["40303265045", "K7399859412"],
  Some(generate),
  None
);
legacy_validator!(
  gb_nhs,
  "gb.nhs",
  "UK NHS Number",
  "NHS number",
  "NHS",
  &["NHS number", "National Health Service number"],
  "\\d{3}\\s?\\d{3}\\s?\\d{4}",
  ValidatorScope::Country(CountryCode::Gb),
  EntityType::Person,
  None,
  &[10],
  &["4010232137"],
  None,
  None
);
legacy_validator!(
  gb_nino,
  "gb.nino",
  "UK National Insurance Number",
  "National Insurance Number",
  "NINO",
  &["National Insurance number", "NINO", "NI number"],
  "[A-Z]{2}\\d{6}[A-Z]",
  ValidatorScope::Country(CountryCode::Gb),
  EntityType::Person,
  Some(
    "https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110"
  ),
  &[9],
  &["AB123456C"],
  Some(generate),
  None
);
legacy_validator!(
  gb_vat,
  "gb.vat",
  "UK VAT Number",
  "VAT Registration Number",
  "VAT",
  &["VAT registration number", "VAT number"],
  "GB\\d{9,12}",
  ValidatorScope::Country(CountryCode::Gb),
  EntityType::Company,
  Some("https://www.gov.uk/vat-registration"),
  &[],
  &["980780684"],
  Some(generate),
  None
);
legacy_validator!(
  gr_vat,
  "gr.vat",
  "Greek VAT Number",
  "Αριθμός Φορολογικού Μητρώου",
  "ΑΦΜ",
  &["ΑΦΜ", "Αριθμός Φορολογικού Μητρώου", "AFM"],
  "EL\\d{9}",
  ValidatorScope::Country(CountryCode::Gr),
  EntityType::Any,
  Some("https://www.aade.gr/"),
  &[],
  &["094259216"],
  Some(generate),
  None
);
legacy_validator!(
  hr_vat,
  "hr.vat",
  "Croatian VAT Number",
  "Osobni identifikacijski broj",
  "OIB",
  &["OIB", "osobni identifikacijski broj"],
  "HR\\d{11}",
  ValidatorScope::Country(CountryCode::Hr),
  EntityType::Any,
  Some("https://www.porezna-uprava.hr/"),
  &[],
  &["33392005961"],
  Some(generate),
  None
);
legacy_validator!(
  hu_vat,
  "hu.vat",
  "Hungarian VAT Number",
  "Adószám",
  "ANUM",
  &["adószám", "adóazonosító jel"],
  "\\d{8}-\\d-\\d{2}",
  ValidatorScope::Country(CountryCode::Hu),
  EntityType::Company,
  Some("https://nav.gov.hu/"),
  &[8],
  &["12892312"],
  Some(generate),
  None
);
legacy_validator!(
  ie_pps,
  "ie.pps",
  "Irish Personal ID",
  "Personal Public Service Number",
  "PPS",
  &["PPS number", "PPSN", "RSI number"],
  "\\d{7}[A-Z]{1,2}",
  ValidatorScope::Country(CountryCode::Ie),
  EntityType::Person,
  Some(
    "https://www.gov.ie/en/service/12e6de-get-a-personal-public-service-pps-number/"
  ),
  &[],
  &["6433435F"],
  Some(generate),
  None
);
legacy_validator!(
  ie_vat,
  "ie.vat",
  "Irish VAT Number",
  "Value Added Tax Number",
  "VAT",
  &["VAT number IE"],
  "IE\\d[A-Z+*]\\d{5}[A-Z]",
  ValidatorScope::Country(CountryCode::Ie),
  EntityType::Any,
  Some("https://www.revenue.ie/"),
  &[],
  &["6433435F", "8D79739I"],
  Some(generate),
  None
);
legacy_validator!(
  it_codice_fiscale,
  "it.codiceFiscale",
  "Italian Tax Code",
  "Codice Fiscale",
  "CF",
  &["codice fiscale", "C.F.", "CF", "cod. fisc.", "fiscal code"],
  "[A-Z]{6}\\d{2}[A-Z]\\d{2}[A-Z]\\d{3}[A-Z]",
  ValidatorScope::Country(CountryCode::It),
  EntityType::Person,
  Some("https://www.agenziaentrate.gov.it/"),
  &[11, 16],
  &["RCCMNL83S18D969H"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  it_iva,
  "it.iva",
  "Italian VAT Number",
  "Partita IVA",
  "P.IVA",
  &["partita IVA", "P.IVA", "P. IVA", "VAT IT"],
  "IT\\d{11}",
  ValidatorScope::Country(CountryCode::It),
  EntityType::Company,
  Some("https://www.agenziaentrate.gov.it/"),
  &[],
  &["00743110157"],
  Some(generate),
  None
);
legacy_validator!(
  lt_asmens,
  "lt.asmens",
  "Lithuanian Personal ID",
  "Asmens kodas",
  "AK",
  &["asmens kodas", "AK"],
  "[3-6]\\d{10}",
  ValidatorScope::Country(CountryCode::Lt),
  EntityType::Person,
  Some("https://www.registrucentras.lt/"),
  &[],
  &["33309240064"],
  Some(generate),
  None
);
legacy_validator!(
  lt_vat,
  "lt.vat",
  "Lithuanian VAT Number",
  "PVM mokėtojo kodas",
  "PVM kodas",
  &["PVM mokėtojo kodas", "PVM"],
  "LT\\d{9,12}",
  ValidatorScope::Country(CountryCode::Lt),
  EntityType::Any,
  Some("https://www.vmi.lt/"),
  &[9, 12],
  &["119511515", "100001919017"],
  Some(generate),
  None
);
legacy_validator!(
  lu_vat,
  "lu.vat",
  "Luxembourg VAT Number",
  "Numéro de TVA",
  "TVA",
  &["TVA", "numéro d'identification TVA"],
  "LU\\d{8}",
  ValidatorScope::Country(CountryCode::Lu),
  EntityType::Company,
  Some("https://pfi.public.lu/"),
  &[8],
  &["15027442"],
  Some(generate),
  None
);
legacy_validator!(
  lv_vat,
  "lv.vat",
  "Latvian VAT Number",
  "PVN reģistrācijas numurs",
  "PVN",
  &["PVN reģistrācijas numurs", "PVN"],
  "LV\\d{11}",
  ValidatorScope::Country(CountryCode::Lv),
  EntityType::Any,
  Some("https://www.pmlp.gov.lv/en/change-personal-identity-number"),
  &[],
  &["40003521600", "32999999999"],
  Some(generate),
  None
);
legacy_validator!(
  mt_vat,
  "mt.vat",
  "Maltese VAT Number",
  "VAT Registration Number",
  "VAT",
  &["VAT number MT"],
  "MT\\d{8}",
  ValidatorScope::Country(CountryCode::Mt),
  EntityType::Company,
  Some("https://cfr.gov.mt/"),
  &[8],
  &["11679112"],
  Some(generate),
  None
);
legacy_validator!(
  nl_vat,
  "nl.vat",
  "Dutch VAT Number",
  "BTW-identificatienummer",
  "BTW",
  &["BTW-nummer", "BTW-id"],
  "NL\\d{9}B\\d{2}",
  ValidatorScope::Country(CountryCode::Nl),
  EntityType::Company,
  Some("https://business.gov.nl/regulations/using-checking-vat-numbers/"),
  &[],
  &["000099998B57"],
  Some(generate),
  None
);
legacy_validator!(
  no_mva,
  "no.mva",
  "Norwegian VAT Number",
  "Merverdiavgift",
  "MVA",
  &["MVA-nummer", "organisasjonsnummer"],
  "NO\\d{9}MVA",
  ValidatorScope::Country(CountryCode::No),
  EntityType::Company,
  Some("https://www.skatteetaten.no/"),
  &[],
  &["995525828MVA"],
  Some(generate),
  None
);
legacy_validator!(
  no_orgnr,
  "no.orgnr",
  "Norwegian Organization Number",
  "Organisasjonsnummer",
  "Orgnr",
  &["organisasjonsnummer", "org.nr"],
  "\\d{9}",
  ValidatorScope::Country(CountryCode::No),
  EntityType::Company,
  Some("https://www.brreg.no/"),
  &[],
  &["923609016"],
  Some(generate),
  None
);
legacy_validator!(
  pl_nip,
  "pl.nip",
  "Polish VAT Number",
  "Numer Identyfikacji Podatkowej",
  "NIP",
  &["NIP", "numer identyfikacji podatkowej"],
  "\\d{3}-?\\d{3}-?\\d{2}-?\\d{2}",
  ValidatorScope::Country(CountryCode::Pl),
  EntityType::Company,
  Some("https://www.biznes.gov.pl/en/portal/004124"),
  &[],
  &["2234567895"],
  Some(generate),
  None
);
legacy_validator!(
  pl_pesel,
  "pl.pesel",
  "Polish National ID",
  "Powszechny Elektroniczny System Ewidencji Ludności",
  "PESEL",
  &["PESEL"],
  "\\d{11}",
  ValidatorScope::Country(CountryCode::Pl),
  EntityType::Person,
  Some("https://www.gov.pl/web/cyfryzacja/numer-pesel"),
  &[],
  &["02070803628"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  pt_cc,
  "pt.cc",
  "Portuguese Identity Card",
  "Cartão de Cidadão",
  "CC",
  &["cartão de cidadão", "CC", "número de identificação civil"],
  "\\d{8}\\s?\\d\\s?[A-Z]{2}\\d",
  ValidatorScope::Country(CountryCode::Pt),
  EntityType::Person,
  Some("https://pt.wikipedia.org/wiki/Cartão_de_cidadão"),
  &[12],
  &["000000000ZZ8"],
  Some(generate),
  None
);
legacy_validator!(
  pt_vat,
  "pt.vat",
  "Portuguese VAT Number",
  "Número de Identificação Fiscal",
  "NIF",
  &["NIF", "número de identificação fiscal", "contribuinte"],
  "PT\\d{9}",
  ValidatorScope::Country(CountryCode::Pt),
  EntityType::Any,
  Some("https://www.portaldasfinancas.gov.pt/"),
  &[9],
  &["501964843"],
  Some(generate),
  None
);
legacy_validator!(
  ro_cnp,
  "ro.cnp",
  "Romanian Personal ID",
  "Cod Numeric Personal",
  "CNP",
  &["CNP", "cod numeric personal"],
  "[1-8]\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{6}",
  ValidatorScope::Country(CountryCode::Ro),
  EntityType::Person,
  Some("https://www.cnp.ro/"),
  &[13],
  &["1630615123457"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  ro_vat,
  "ro.vat",
  "Romanian VAT Number",
  "Cod de Identificare Fiscală",
  "CIF",
  &["CUI", "CIF", "cod de identificare fiscală", "cod fiscal"],
  "RO\\d{2,10}",
  ValidatorScope::Country(CountryCode::Ro),
  EntityType::Any,
  Some("https://www.anaf.ro/"),
  &[2, 3, 4, 5, 6, 7, 8, 9, 10],
  &["18547290"],
  Some(generate),
  None
);
legacy_validator!(
  se_personnummer,
  "se.personnummer",
  "Swedish Personal ID",
  "Personnummer",
  "PN",
  &[
    "personnummer",
    "personnr",
    "pers.nr",
    "personal identity number"
  ],
  "\\d{6,8}-\\d{4}",
  ValidatorScope::Country(CountryCode::Se),
  EntityType::Person,
  Some(
    "https://www.skatteverket.se/privat/folkbokforing/personnummer.4.3810a01c150939e893f18c29.html"
  ),
  &[],
  &["880320-0016"],
  Some(generate),
  Some(parse)
);
legacy_validator!(
  si_vat,
  "si.vat",
  "Slovenian VAT Number",
  "Davčna številka",
  "DDV",
  &["DDV", "identifikacijska številka za DDV"],
  "SI\\d{8}",
  ValidatorScope::Country(CountryCode::Si),
  EntityType::Company,
  Some("https://www.fu.gov.si/"),
  &[8],
  &["15012557"],
  Some(generate),
  None
);
legacy_validator!(
  sk_dic,
  "sk.dic",
  "Slovak VAT Number",
  "Identifikačné číslo pre daň z pridanej hodnoty",
  "IČ DPH",
  &["DIČ", "daňové identifikačné číslo"],
  "SK\\d{10}",
  ValidatorScope::Country(CountryCode::Sk),
  EntityType::Company,
  Some("https://www.financnasprava.sk/"),
  &[],
  &["2021853504"],
  Some(generate),
  None
);
legacy_validator!(
  us_rtn,
  "us.rtn",
  "Routing Transit Number",
  "Routing Transit Number",
  "RTN",
  &[
    "RTN",
    "ABA",
    "Routing Number",
    "ABA Routing Number",
    "Routing Transit Number"
  ],
  "\\d{9}",
  ValidatorScope::Country(CountryCode::Us),
  EntityType::Company,
  Some("https://en.wikipedia.org/wiki/ABA_routing_transit_number"),
  &[9],
  &["111000025", "021000021"],
  Some(generate),
  None
);

pub static VALIDATORS: &[&Validator] = &[
  &at_tin::VALIDATOR,
  &at_uid::VALIDATOR,
  &au_acn::VALIDATOR,
  &be_nn::VALIDATOR,
  &be_vat::VALIDATOR,
  &bg_vat::VALIDATOR,
  &br_cnpj::VALIDATOR,
  &ch_uid::VALIDATOR,
  &cn_ric::VALIDATOR,
  &cy_vat::VALIDATOR,
  &cz_dic::VALIDATOR,
  &cz_rc::VALIDATOR,
  &de_idnr::VALIDATOR,
  &de_stnr::VALIDATOR,
  &de_svnr::VALIDATOR,
  &de_vat::VALIDATOR,
  &dk_cpr::VALIDATOR,
  &dk_vat::VALIDATOR,
  &ee_ik::VALIDATOR,
  &ee_vat::VALIDATOR,
  &es_cif::VALIDATOR,
  &es_nie::VALIDATOR,
  &es_nss::VALIDATOR,
  &es_vat::VALIDATOR,
  &fi_hetu::VALIDATOR,
  &fi_vat::VALIDATOR,
  &fi_ytunnus::VALIDATOR,
  &fr_nir::VALIDATOR,
  &fr_siren::VALIDATOR,
  &fr_siret::VALIDATOR,
  &fr_tva::VALIDATOR,
  &gb_nhs::VALIDATOR,
  &gb_nino::VALIDATOR,
  &gb_vat::VALIDATOR,
  &gr_vat::VALIDATOR,
  &hr_vat::VALIDATOR,
  &hu_vat::VALIDATOR,
  &ie_pps::VALIDATOR,
  &ie_vat::VALIDATOR,
  &it_codice_fiscale::VALIDATOR,
  &it_iva::VALIDATOR,
  &lt_asmens::VALIDATOR,
  &lt_vat::VALIDATOR,
  &lu_vat::VALIDATOR,
  &lv_vat::VALIDATOR,
  &mt_vat::VALIDATOR,
  &nl_vat::VALIDATOR,
  &no_mva::VALIDATOR,
  &no_orgnr::VALIDATOR,
  &pl_nip::VALIDATOR,
  &pl_pesel::VALIDATOR,
  &pt_cc::VALIDATOR,
  &pt_vat::VALIDATOR,
  &ro_cnp::VALIDATOR,
  &ro_vat::VALIDATOR,
  &se_personnummer::VALIDATOR,
  &si_vat::VALIDATOR,
  &sk_dic::VALIDATOR,
  &us_rtn::VALIDATOR,
];

fn compact_for(id: &str, value: &str) -> String {
  if id == "se.personnummer" {
    return crate::compact_se_personnummer(value);
  }
  if id == "gb.nhs" {
    return crate::compact_without(value.trim(), &[' ']);
  }
  if matches!(id, "cz.rc" | "pt.cc") {
    let skipped: &[char] = if id == "cz.rc" { &[' ', '/'] } else { &[' '] };
    let mut compact = crate::compact_without(value.trim(), skipped);
    if id == "pt.cc" {
      compact.make_ascii_uppercase();
    }
    return compact;
  }
  let skipped: &[char] = if id == "fi.hetu" {
    &[' ']
  } else {
    &[' ', '-', '/', '.', ',', ':']
  };
  let mut value = crate::compact_without(value, skipped);
  let prefix = match id {
    "at.uid" => Some("AT"),
    "be.vat" => Some("BE"),
    "bg.vat" => Some("BG"),
    "cy.vat" => Some("CY"),
    "cz.dic" => Some("CZ"),
    "de.vat" => Some("DE"),
    "dk.vat" => Some("DK"),
    "ee.vat" => Some("EE"),
    "es.cif" | "es.vat" => Some("ES"),
    "fi.vat" => Some("FI"),
    "fr.tva" => Some("FR"),
    "gb.vat" => Some("GB"),
    "hr.vat" => Some("HR"),
    "hu.vat" => Some("HU"),
    "ie.vat" => Some("IE"),
    "it.iva" => Some("IT"),
    "lt.vat" => Some("LT"),
    "lu.vat" => Some("LU"),
    "lv.vat" => Some("LV"),
    "mt.vat" => Some("MT"),
    "nl.vat" => Some("NL"),
    "no.mva" => Some("NO"),
    "pl.nip" => Some("PL"),
    "pt.vat" => Some("PT"),
    "ro.vat" => Some("RO"),
    "si.vat" => Some("SI"),
    "sk.dic" => Some("SK"),
    _ => None,
  };
  if id == "gr.vat" {
    if value.get(..2).is_some_and(|v| {
      v.eq_ignore_ascii_case("EL") || v.eq_ignore_ascii_case("GR")
    }) {
      value.drain(..2);
    }
  } else if let Some(prefix) = prefix {
    if value
      .get(..2)
      .is_some_and(|v| v.eq_ignore_ascii_case(prefix))
    {
      value.drain(..2);
    }
  }
  if id == "be.vat" && value.len() == 9 {
    value.insert(0, '0');
  }
  if id == "gr.vat" && value.len() == 8 {
    value.insert(0, '0');
  }
  if id == "nl.vat" {
    value.make_ascii_uppercase();
    if let Some(index) = value.find('B') {
      while index < 9 && value.len() < 12 {
        value.insert(0, '0');
      }
    }
  }
  if matches!(
    id,
    "at.uid"
      | "br.cnpj"
      | "ch.uid"
      | "cn.ric"
      | "cy.vat"
      | "de.svnr"
      | "es.cif"
      | "es.nie"
      | "es.vat"
      | "fi.hetu"
      | "fr.tva"
      | "gb.nino"
      | "gb.vat"
      | "ie.pps"
      | "ie.vat"
      | "it.codiceFiscale"
      | "no.mva"
      | "pt.cc"
  ) {
    value.make_ascii_uppercase();
  }
  value
}

fn span(value: &str, start: usize, end: usize) -> &str {
  value
    .get(start.min(value.len())..end.min(value.len()))
    .unwrap_or("")
}

fn format_for(id: &str, value: &str) -> String {
  let v = compact_for(id, value);
  let prefixed = match id {
    "at.uid" => Some("AT"),
    "be.vat" => Some("BE"),
    "bg.vat" => Some("BG"),
    "cy.vat" => Some("CY"),
    "cz.dic" => Some("CZ"),
    "de.vat" => Some("DE"),
    "dk.vat" => Some("DK"),
    "ee.vat" => Some("EE"),
    "es.vat" => Some("ES"),
    "fi.vat" => Some("FI"),
    "fr.tva" => Some("FR"),
    "gr.vat" => Some("EL"),
    "hr.vat" => Some("HR"),
    "hu.vat" => Some("HU"),
    "ie.vat" => Some("IE"),
    "it.iva" => Some("IT"),
    "lt.vat" => Some("LT"),
    "lu.vat" => Some("LU"),
    "lv.vat" => Some("LV"),
    "mt.vat" => Some("MT"),
    "nl.vat" => Some("NL"),
    "pl.nip" => Some("PL"),
    "pt.vat" => Some("PT"),
    "ro.vat" => Some("RO"),
    "si.vat" => Some("SI"),
    "sk.dic" => Some("SK"),
    _ => None,
  };
  if let Some(prefix) = prefixed {
    return format!("{prefix}{v}");
  }
  match id {
    "at.tin" => format!(
      "{}-{}/{}",
      span(&v, 0, 2),
      span(&v, 2, 8),
      span(&v, 8, v.len())
    ),
    "au.acn" | "fr.siren" | "gb.nhs" | "no.orgnr" => format!(
      "{} {} {}",
      span(&v, 0, 3),
      span(&v, 3, 6),
      span(&v, 6, v.len())
    ),
    "be.nn" => format!(
      "{}.{}.{}-{}.{}",
      span(&v, 0, 2),
      span(&v, 2, 4),
      span(&v, 4, 6),
      span(&v, 6, 9),
      span(&v, 9, v.len())
    ),
    "br.cnpj" => format!(
      "{}.{}.{}/{}-{}",
      span(&v, 0, 2),
      span(&v, 2, 5),
      span(&v, 5, 8),
      span(&v, 8, 12),
      span(&v, 12, v.len())
    ),
    "ch.uid" => format!(
      "CHE-{}.{}.{}",
      span(&v, 3, 6),
      span(&v, 6, 9),
      span(&v, 9, v.len())
    ),
    "cz.rc" => format!("{}/{}", span(&v, 0, 6), span(&v, 6, v.len())),
    "de.idnr" => format!(
      "{} {} {} {}",
      span(&v, 0, 2),
      span(&v, 2, 5),
      span(&v, 5, 8),
      span(&v, 8, v.len())
    ),
    "de.stnr" => format_de_stnr(&v),
    "de.svnr" => format!(
      "{} {} {} {} {}",
      span(&v, 0, 2),
      span(&v, 2, 8),
      span(&v, 8, 9),
      span(&v, 9, 11),
      span(&v, 11, v.len())
    ),
    "dk.cpr" => format!("{}-{}", span(&v, 0, 6), span(&v, 6, v.len())),
    "es.nss" => format!(
      "{}/{}/{}",
      span(&v, 0, 2),
      span(&v, 2, 10),
      span(&v, 10, v.len())
    ),
    "fi.ytunnus" => format!("{}-{}", span(&v, 0, 7), span(&v, 7, v.len())),
    "fr.nir" => format!(
      "{} {} {} {} {} {} {}",
      span(&v, 0, 1),
      span(&v, 1, 3),
      span(&v, 3, 5),
      span(&v, 5, 7),
      span(&v, 7, 10),
      span(&v, 10, 13),
      span(&v, 13, v.len())
    ),
    "fr.siret" => format!(
      "{} {} {} {}",
      span(&v, 0, 3),
      span(&v, 3, 6),
      span(&v, 6, 9),
      span(&v, 9, v.len())
    ),
    "gb.nino" => format!(
      "{} {} {} {} {}",
      span(&v, 0, 2),
      span(&v, 2, 4),
      span(&v, 4, 6),
      span(&v, 6, 8),
      span(&v, 8, v.len())
    ),
    "gb.vat" if v.starts_with("GD") || v.starts_with("HA") => format!("GB{v}"),
    "gb.vat" => format!(
      "GB {} {} {}",
      span(&v, 0, 3),
      span(&v, 3, 7),
      span(&v, 7, v.len())
    ),
    "no.mva" => {
      let d = v.strip_suffix("MVA").unwrap_or(&v);
      format!(
        "NO {} {} {} MVA",
        span(d, 0, 3),
        span(d, 3, 6),
        span(d, 6, d.len())
      )
    }
    "pt.cc" if v.len() >= 3 => format!(
      "{} {} {}",
      span(&v, 0, v.len() - 3),
      span(&v, v.len() - 3, v.len() - 1),
      span(&v, v.len() - 1, v.len())
    ),
    _ => v,
  }
}

fn format_de_stnr(value: &str) -> String {
  let Some(pattern) = crate::DE_STNR_PATTERNS.iter().find(|pattern| {
    pattern.len() == value.len()
      && crate::de_stnr_pattern_matches(value, pattern)
  }) else {
    return value.to_owned();
  };
  let mut segments = Vec::new();
  let mut current = String::new();
  let mut previous = None;
  for (value_character, pattern_character) in value.chars().zip(pattern.chars())
  {
    let category = if pattern_character.is_ascii_digit() {
      'L'
    } else {
      pattern_character
    };
    if previous.is_some_and(|previous| previous != category) {
      segments.push(std::mem::take(&mut current));
    }
    current.push(value_character);
    previous = Some(category);
  }
  if !current.is_empty() {
    segments.push(current);
  }
  segments.join("/")
}

fn expected_lengths(id: &str) -> &'static [usize] {
  match id {
    "bg.vat" => &[9, 10],
    "cn.ric" => &[15, 18],
    "cz.dic" => &[8, 9, 10],
    "cz.rc" => &[9, 10],
    "de.stnr" => &[10, 11, 13],
    "de.svnr" | "es.nss" | "pt.cc" => &[12],
    "de.vat" => &[9],
    "dk.cpr" => &[10],
    "dk.vat" | "fi.vat" | "hu.vat" | "lu.vat" | "mt.vat" | "si.vat" => &[8],
    "fi.hetu" => &[11],
    "fr.nir" => &[15],
    "gb.nhs" => &[10],
    "gb.nino" => &[9],
    "it.codiceFiscale" => &[11, 16],
    "lt.vat" => &[9, 12],
    "pt.vat" | "us.rtn" => &[9],
    "ro.cnp" => &[13],
    "ro.vat" => &[2, 3, 4, 5, 6, 7, 8, 9, 10],
    "at.tin" | "at.uid" | "au.acn" | "ee.vat" | "es.cif" | "es.nie"
    | "es.vat" | "fr.siren" | "gr.vat" | "no.orgnr" => &[9],
    "be.nn" | "de.idnr" | "lt.asmens" | "lv.vat" => &[11],
    "ch.uid" | "nl.vat" | "no.mva" => &[12],
    "ie.pps" | "ie.vat" => &[8, 9],
    "be.vat" | "sk.dic" | "pl.nip" => &[10],
    "br.cnpj" | "fr.siret" => &[14],
    "cy.vat" => &[9],
    "ee.ik" | "hr.vat" | "it.iva" => &[11],
    "fi.ytunnus" => &[8],
    "fr.tva" => &[11],
    "gb.vat" => &[5, 9, 12],
    "pl.pesel" => &[11],
    "se.personnummer" => &[11, 13],
    _ => &[],
  }
}

fn raw_is_valid(id: &str, value: &str) -> bool {
  match id {
    "au.acn" => crate::validate_au_acn(value),
    "at.tin" => crate::validate_at_tin(value),
    "at.uid" => crate::validate_at_uid(value),
    "be.nn" => crate::validate_be_nn(value),
    "be.vat" => crate::validate_be_vat(value),
    "bg.vat" => crate::validate_bg_vat(value),
    "br.cnpj" => crate::validate_cnpj(value),
    "ch.uid" => crate::validate_ch_uid(value),
    "cn.ric" => crate::validate_cn_ric(value),
    "cy.vat" => crate::validate_cy_vat(value),
    "cz.dic" => crate::validate_cz_dic(value),
    "cz.rc" => crate::validate_cz_rc(value),
    "de.idnr" => crate::validate_de_idnr(value),
    "de.stnr" => crate::validate_de_stnr(value),
    "de.svnr" => crate::validate_de_svnr(value),
    "de.vat" => crate::validate_de_vat(value),
    "dk.cpr" => crate::validate_dk_cpr(value),
    "dk.vat" => crate::validate_dk_vat(value),
    "ee.ik" => crate::validate_ee_ik(value),
    "ee.vat" => crate::validate_ee_vat(value),
    "es.cif" => crate::validate_es_cif(value),
    "es.nie" => crate::validate_es_nie(value),
    "es.nss" => crate::validate_es_nss(value),
    "es.vat" => crate::validate_es_vat(value),
    "fi.hetu" => crate::validate_fi_hetu(value),
    "fi.vat" => crate::validate_fi_vat(value),
    "fi.ytunnus" => crate::validate_fi_ytunnus(value),
    "fr.nir" => crate::validate_fr_nir(value),
    "fr.siren" => crate::validate_fr_siren(value),
    "fr.siret" => crate::validate_fr_siret(value),
    "fr.tva" => crate::validate_fr_tva(value),
    "gb.nhs" => crate::validate_gb_nhs(value),
    "gb.nino" => crate::validate_gb_nino(value),
    "gb.vat" => crate::validate_gb_vat(value),
    "gr.vat" => crate::validate_gr_vat(value),
    "hr.vat" => crate::validate_hr_vat(value),
    "hu.vat" => crate::validate_hu_vat(value),
    "ie.pps" => crate::validate_ie_pps(value),
    "ie.vat" => crate::validate_ie_vat(value),
    "it.codiceFiscale" => crate::validate_it_codice_fiscale(value),
    "it.iva" => crate::validate_it_iva(value),
    "lt.asmens" => crate::validate_lt_asmens(value),
    "lt.vat" => crate::validate_lt_vat(value),
    "lu.vat" => crate::validate_lu_vat(value),
    "lv.vat" => crate::validate_lv_vat(value),
    "mt.vat" => crate::validate_mt_vat(value),
    "nl.vat" => crate::validate_nl_vat(value),
    "no.mva" => crate::validate_no_mva(value),
    "no.orgnr" => crate::validate_no_orgnr(value),
    "pl.nip" => crate::validate_pl_nip(value),
    "pl.pesel" => crate::validate_pl_pesel(value),
    "pt.cc" => crate::validate_pt_cc(value),
    "pt.vat" => crate::validate_pt_vat(value),
    "ro.cnp" => crate::validate_ro_cnp(value),
    "ro.vat" => crate::validate_ro_vat(value),
    "se.personnummer" => crate::validate_se_personnummer(value),
    "si.vat" => crate::validate_si_vat(value),
    "sk.dic" => crate::validate_sk_dic(value),
    "us.rtn" => crate::validate_us_routing(value),
    _ => false,
  }
}

fn validate_pl_nip_canonical(value: &str) -> CanonicalValidation {
  if !value.is_ascii()
    || value.trim() != value
    || value
      .bytes()
      .any(|byte| matches!(byte, b' ' | b'-' | b'/' | b'.' | b',' | b':'))
    || value
      .get(..2)
      .is_some_and(|prefix| prefix.eq_ignore_ascii_case("PL"))
  {
    return CanonicalValidation::NotCanonical;
  }
  if value.len() != 10 {
    return CanonicalValidation::Invalid(ValidationError::InvalidLength(
      "identifier has an invalid length",
    ));
  }
  if !value.bytes().all(|byte| byte.is_ascii_digit()) {
    return CanonicalValidation::Invalid(ValidationError::InvalidFormat(
      "identifier has an invalid format",
    ));
  }
  if crate::validate_pl_nip_ascii(value.as_bytes()) {
    CanonicalValidation::Valid
  } else {
    CanonicalValidation::Invalid(ValidationError::InvalidChecksum(
      "identifier checksum or components are invalid",
    ))
  }
}

fn validate_for(id: &str, value: &str) -> ValidationResult {
  if id == "pl.nip" {
    match validate_pl_nip_canonical(value) {
      CanonicalValidation::Valid => return Ok(value.to_owned()),
      CanonicalValidation::Invalid(error) => return Err(error),
      CanonicalValidation::NotCanonical => {}
    }
  }
  let compact = compact_for(id, value);
  if raw_is_valid(id, &compact) {
    return Ok(compact);
  }
  if format_precedes_length(id, &compact) {
    return Err(ValidationError::InvalidFormat(
      "identifier has an invalid format",
    ));
  }
  let lengths = expected_lengths(id);
  if !lengths.is_empty() && !lengths.contains(&compact.len()) {
    return Err(ValidationError::InvalidLength(
      "identifier has an invalid length",
    ));
  }
  if invalid_structure(id, &compact) {
    return Err(ValidationError::InvalidFormat(
      "identifier has an invalid format",
    ));
  }
  if matches!(id, "cz.dic" | "cz.rc")
    && compact.len() == 9
    && compact
      .get(..2)
      .and_then(|year| year.parse::<u32>().ok())
      .is_some_and(|year| year >= 54)
  {
    return Err(ValidationError::InvalidComponent(
      "identifier contains an invalid component",
    ));
  }
  if compact.is_empty()
    || !compact
      .chars()
      .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '+' | '-'))
  {
    return Err(ValidationError::InvalidFormat(
      "identifier has an invalid format",
    ));
  }
  Err(ValidationError::InvalidChecksum(
    "identifier checksum or components are invalid",
  ))
}

fn ascii_digits(value: &str) -> bool {
  !value.is_empty() && value.bytes().all(|byte| byte.is_ascii_digit())
}

fn format_precedes_length(id: &str, value: &str) -> bool {
  match id {
    "au.acn" | "ca.sin" | "de.stnr" => !ascii_digits(value),
    "no.mva" => !value.ends_with("MVA"),
    _ => false,
  }
}

fn invalid_structure(id: &str, value: &str) -> bool {
  let bytes = value.as_bytes();
  match id {
    "be.vat" | "bg.vat" | "cz.dic" | "dk.cpr" | "pl.nip" | "ro.vat"
    | "sk.dic" => !ascii_digits(value),
    "cy.vat" => {
      !value.get(..8).is_some_and(ascii_digits)
        || !value.get(8..).is_some_and(|check| {
          check.len() == 1
            && check.bytes().all(|byte| byte.is_ascii_uppercase())
        })
    }
    "gb.nino" => {
      bytes.len() != 9
        || !bytes
          .get(..2)
          .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
        || !bytes
          .get(2..8)
          .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
        || !bytes
          .get(8)
          .is_some_and(|suffix| matches!(*suffix, b'A'..=b'D'))
    }
    "ie.pps" => {
      !value.get(..7).is_some_and(ascii_digits)
        || bytes
          .get(8)
          .is_some_and(|second| !b"WABCDEFGHIJKLMNOPQRSTUV".contains(second))
    }
    "ie.vat" => !irish_vat_shape(bytes),
    "it.codiceFiscale" => {
      value.len() == 16
        && (!bytes
          .get(..6)
          .is_some_and(|part| part.iter().all(u8::is_ascii_uppercase))
          || !bytes.get(15).is_some_and(u8::is_ascii_uppercase))
    }
    "nl.vat" => {
      !value.get(..9).is_some_and(ascii_digits)
        || bytes.get(9) != Some(&b'B')
        || !value.get(10..).is_some_and(ascii_digits)
    }
    "no.mva" => !value
      .strip_suffix("MVA")
      .is_some_and(|digits| digits.len() == 9 && ascii_digits(digits)),
    "pt.cc" => {
      !value.get(..9).is_some_and(ascii_digits)
        || !bytes
          .get(9..11)
          .is_some_and(|part| part.iter().all(u8::is_ascii_alphanumeric))
        || !bytes.get(11).is_some_and(u8::is_ascii_digit)
    }
    "se.personnummer" => {
      let separator = value.len().saturating_sub(5);
      !bytes
        .get(separator)
        .is_some_and(|byte| matches!(byte, b'-' | b'+'))
        || bytes
          .iter()
          .enumerate()
          .any(|(index, byte)| index != separator && !byte.is_ascii_digit())
    }
    _ => false,
  }
}

fn irish_vat_shape(value: &[u8]) -> bool {
  let new = value
    .get(..7)
    .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    && value.get(7).is_some_and(u8::is_ascii_uppercase)
    && value.get(8).is_none_or(|byte| {
      byte.is_ascii_uppercase() || matches!(byte, b'+' | b'*')
    });
  let old = value.len() == 8
    && value.first().is_some_and(u8::is_ascii_digit)
    && value.get(1).is_some_and(|byte| {
      byte.is_ascii_uppercase() || matches!(byte, b'+' | b'*')
    })
    && value
      .get(2..7)
      .is_some_and(|part| part.iter().all(u8::is_ascii_digit))
    && value.get(7).is_some_and(u8::is_ascii_uppercase);
  new || old
}

fn generate_for(id: &str, example: &str) -> String {
  let original = compact_for(id, example);
  let alphabet = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for _ in 0..64 {
    let mut candidate = original.as_bytes().to_vec();
    let digit_positions = candidate
      .iter()
      .enumerate()
      .filter_map(|(index, byte)| byte.is_ascii_digit().then_some(index))
      .collect::<Vec<_>>();
    if digit_positions.len() < 2 {
      break;
    }
    let payload_index = digit_positions
      [crate::random_below(digit_positions.len().saturating_sub(1))];
    let old = candidate[payload_index];
    let mut replacement =
      b'0'.saturating_add(u8::try_from(crate::random_below(10)).unwrap_or(0));
    if replacement == old {
      replacement = b'0'.saturating_add((replacement - b'0' + 1) % 10);
    }
    candidate[payload_index] = replacement;

    for repair_index in 0..candidate.len() {
      if !candidate[repair_index].is_ascii_alphanumeric() {
        continue;
      }
      let saved = candidate[repair_index];
      for replacement in alphabet {
        candidate[repair_index] = *replacement;
        if let Ok(value) = std::str::from_utf8(&candidate) {
          if raw_is_valid(id, value) {
            return compact_for(id, value);
          }
        }
      }
      candidate[repair_index] = saved;
    }
  }
  original
}

fn digits(value: &str, start: usize, end: usize) -> Option<i32> {
  span(value, start, end).parse().ok()
}
fn person(
  year: i32,
  month: i32,
  day: i32,
  gender: Gender,
) -> Option<ParsedIdentifier> {
  Some(ParsedIdentifier {
    birth_date: IsoDate {
      year,
      month: u8::try_from(month).ok()?,
      day: u8::try_from(day).ok()?,
    },
    gender: Some(gender),
  })
}

fn parse_for(id: &str, value: &str) -> Option<ParsedIdentifier> {
  let v = validate_for(id, value).ok()?;
  let parity = |digit: char| {
    if digit.to_digit(10)? % 2 == 0 {
      Some(Gender::Female)
    } else {
      Some(Gender::Male)
    }
  };
  match id {
    "cn.ric" if v.len() == 18 => person(
      digits(&v, 6, 10)?,
      digits(&v, 10, 12)?,
      digits(&v, 12, 14)?,
      parity(v.chars().nth(16)?)?,
    ),
    "cn.ric" => person(
      1900 + digits(&v, 6, 8)?,
      digits(&v, 8, 10)?,
      digits(&v, 10, 12)?,
      parity(v.chars().nth(14)?)?,
    ),
    "cz.rc" => {
      let yy = digits(&v, 0, 2)?;
      let mut mm = digits(&v, 2, 4)?;
      let gender = if mm > 50 {
        mm -= 50;
        Gender::Female
      } else {
        Gender::Male
      };
      person(
        if v.len() == 9 && yy >= 54 {
          1800 + yy
        } else if yy >= 54 {
          1900 + yy
        } else {
          2000 + yy
        },
        mm,
        digits(&v, 4, 6)?,
        gender,
      )
    }
    "dk.cpr" => {
      let yy = digits(&v, 4, 6)?;
      let s = digits(&v, 6, 7)?;
      let century = if s <= 3 {
        1900
      } else if s == 4 || s == 9 {
        if yy <= 36 { 2000 } else { 1900 }
      } else if yy <= 57 {
        2000
      } else {
        1800
      };
      person(
        century + yy,
        digits(&v, 2, 4)?,
        digits(&v, 0, 2)?,
        parity(v.chars().nth(8)?)?,
      )
    }
    "ee.ik" => {
      let g = digits(&v, 0, 1)?;
      let century = match g {
        1 | 2 => 1800,
        3 | 4 => 1900,
        5 | 6 => 2000,
        7 | 8 => 2100,
        _ => return None,
      };
      person(
        century + digits(&v, 1, 3)?,
        digits(&v, 3, 5)?,
        digits(&v, 5, 7)?,
        if g % 2 == 1 {
          Gender::Male
        } else {
          Gender::Female
        },
      )
    }
    "fi.hetu" => {
      let century = match v.chars().nth(6)? {
        '+' => 1800,
        '-' => 1900,
        'A' => 2000,
        _ => return None,
      };
      person(
        century + digits(&v, 4, 6)?,
        digits(&v, 2, 4)?,
        digits(&v, 0, 2)?,
        parity(v.chars().nth(9)?)?,
      )
    }
    "fr.nir" => person(
      if digits(&v, 1, 3)? <= 26 {
        2000 + digits(&v, 1, 3)?
      } else {
        1900 + digits(&v, 1, 3)?
      },
      digits(&v, 3, 5)?,
      1,
      if v.starts_with('1') {
        Gender::Male
      } else {
        Gender::Female
      },
    ),
    "it.codiceFiscale" if v.len() == 16 => {
      let decode = |c: char| {
        "0123456789LMNPQRSTUV"
          .find(c)
          .and_then(|x| i32::try_from(x % 10).ok())
      };
      let yy = decode(v.chars().nth(6)?)? * 10 + decode(v.chars().nth(7)?)?;
      let month = "ABCDEHLMPRST"
        .find(v.chars().nth(8)?)
        .and_then(|x| i32::try_from(x + 1).ok())?;
      let mut day =
        decode(v.chars().nth(9)?)? * 10 + decode(v.chars().nth(10)?)?;
      let gender = if day > 40 {
        day -= 40;
        Gender::Female
      } else {
        Gender::Male
      };
      person(
        if yy <= 26 { 2000 + yy } else { 1900 + yy },
        month,
        day,
        gender,
      )
    }
    "pl.pesel" => {
      let yy = digits(&v, 0, 2)?;
      let raw = digits(&v, 2, 4)?;
      let (century, month) = if raw >= 81 {
        (1800, raw - 80)
      } else if raw <= 12 {
        (1900, raw)
      } else if raw <= 32 {
        (2000, raw - 20)
      } else if raw <= 52 {
        (2100, raw - 40)
      } else {
        (2200, raw - 60)
      };
      person(
        century + yy,
        month,
        digits(&v, 4, 6)?,
        parity(v.chars().nth(9)?)?,
      )
    }
    "ro.cnp" => {
      let g = digits(&v, 0, 1)?;
      let century = match g {
        1 | 2 => 1900,
        3 | 4 => 1800,
        5 | 6 => 2000,
        _ => 1900,
      };
      person(
        century + digits(&v, 1, 3)?,
        digits(&v, 3, 5)?,
        digits(&v, 5, 7)?,
        if g % 2 == 1 {
          Gender::Male
        } else {
          Gender::Female
        },
      )
    }
    "se.personnummer" => {
      let separator = v.chars().rev().nth(4)?;
      let (year, month, day) = if v.len() == 13 {
        (digits(&v, 0, 4)?, digits(&v, 4, 6)?, digits(&v, 6, 8)?)
      } else {
        let yy = digits(&v, 0, 2)?;
        let mut century = if yy > 26 { 1900 } else { 2000 };
        if separator == '+' {
          century -= 100;
        }
        (century + yy, digits(&v, 2, 4)?, digits(&v, 4, 6)?)
      };
      person(year, month, day, parity(v.chars().rev().nth(1)?)?)
    }
    _ => None,
  }
}

#[cfg(test)]
mod tests {
  use super::VALIDATORS;

  #[test]
  fn catalog_examples_and_generators_validate() {
    for validator in VALIDATORS {
      for example in validator.examples() {
        assert!(
          validator.is_valid(example),
          "{} rejected catalog example {example}",
          validator.id()
        );
      }
      if let Some(generated) = validator.generate() {
        assert!(
          validator.is_valid(&generated),
          "{} generated invalid value {generated}",
          validator.id()
        );
      }
    }
  }

  #[test]
  fn parsers_accept_catalog_examples() {
    for validator in VALIDATORS.iter().filter(|item| item.can_parse()) {
      assert!(
        validator.parse(validator.examples()[0]).is_some(),
        "{} failed to parse its catalog example",
        validator.id()
      );
    }
  }
}

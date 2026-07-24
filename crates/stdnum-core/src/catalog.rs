//! Optional human-readable catalog descriptions.

#[must_use]
#[allow(clippy::too_many_lines)]
#[allow(clippy::redundant_pub_crate)] // Shared by the sibling `types` module.
pub(crate) fn description(id: &str) -> Option<&'static str> {
  match id {
    "ae.eid" => Some("15-digit identity number issued to UAE residents"),
    "ai.tin" => {
      Some("Anguilla tax number issued by the Inland Revenue Department")
    }
    "bd.nid" => Some(
      "National identity number issued by the Bangladesh Election Commission",
    ),
    "bh.cpr" => Some("9-digit personal identification number"),
    "bz.tin" => {
      Some("Belize tax number issued by the Belize Tax Service Department")
    }
    "cn.ric" => Some(
      "18-character national ID encoding area, birth date, gender, and check digit",
    ),
    "cn.uscc" => {
      Some("18-character tax/registration code for Chinese entities")
    }
    "co.nit" => Some("Tax identifier issued by the DIAN"),
    "cz.ico" => {
      Some("8-digit company ID assigned by the Czech Statistical Office")
    }
    "cz.rc" => {
      Some("Czech/Slovak national identifier encoding birth date and gender")
    }
    "de.stnr" => Some(
      "German tax number assigned by the local tax office, varies by federal state",
    ),
    "de.svnr" => Some(
      "German social insurance number encoding birth date and name initial",
    ),
    "de.vat" => Some("German VAT ID issued by the Federal Tax Office (BZSt)"),
    "ec.ruc" => Some("13-digit tax identification number issued by the SRI"),
    "eg.tn" => Some("Egyptian tax identification number"),
    "es.nss" => Some(
      "Spanish Social Security affiliation number with mod-97 check digits",
    ),
    "fr.nir" => Some(
      "French social security number encoding gender, birth date, and department",
    ),
    "gb.nino" => Some("UK National Insurance Number for tax and benefits"),
    "gh.tin" => Some("Ghanaian tax identification number"),
    "gt.nit" => Some("Tax identifier issued by Guatemala's SAT"),
    "hk.hkid" => Some(
      "Identity card number issued by the Hong Kong Immigration Department",
    ),
    "iban" => Some("International bank account number per ISO 13616"),
    "id.npwp" => Some(
      "15 or 16-digit tax identification number issued by the Directorate General of Taxes",
    ),
    "il.idnr" => Some("Israeli personal identification number (Mispar Zehut)"),
    "in.aadhaar" => Some("12-digit unique identity number issued by UIDAI"),
    "in.gstin" => {
      Some("15-character tax identifier for GST-registered businesses")
    }
    "in.pan" => Some("10-character alphanumeric tax identifier"),
    "iq.nid" => Some("Iraqi personal identification number (National Card)"),
    "ir.nid" => Some("Iranian personal identification number (Code Melli)"),
    "it.codiceFiscale" => {
      Some("Personal/company tax code (16-char personal, 11-digit company)")
    }
    "jp.cn" => {
      Some("13-digit corporate identifier assigned by the National Tax Agency")
    }
    "jp.mynumber" => {
      Some("12-digit personal identifier for tax and social security")
    }
    "kr.brn" => {
      Some("10-digit business identifier issued by the National Tax Service")
    }
    "kr.rrn" => Some(
      "13-digit personal identifier issued to all residents of South Korea",
    ),
    "kw.civil" => Some("12-digit civil identification number issued by PACI"),
    "lk.nic" => {
      Some("Sri Lankan personal identity number issued to all citizens")
    }
    "ma.ice" => Some("Moroccan common enterprise identifier"),
    "mu.brn" => {
      Some("Mauritius business registration number issued by the CBRD")
    }
    "my.nric" => Some(
      "12-digit identity card number encoding birth date, place of birth, and gender",
    ),
    "ng.nin" => Some("11-digit national identity number issued by NIMC"),
    "ni.ruc" => Some("Tax identifier issued by Nicaragua's DGI"),
    "nz.ird" => Some("New Zealand Inland Revenue Department number"),
    "pa.ruc" => Some("Tax identifier issued by Panama's DGI"),
    "ph.philid" => Some(
      "12-digit personal identifier issued under the Philippine Identification System",
    ),
    "pk.cnic" => Some("13-digit identity card number issued by NADRA"),
    "pt.cc" => Some(
      "Alphanumeric national identity card number with Luhn-like check digit",
    ),
    "sg.uen" => Some("9 or 10-character business identifier issued by ACRA"),
    "th.tin" => Some("13-digit tax identifier for individuals and companies"),
    "tw.ubn" => Some(
      "8-digit company identifier issued by the Ministry of Economic Affairs",
    ),
    "vn.mst" => Some("10- or 13-digit tax identifier for enterprises"),
    "za.idnr" => Some("South African personal identification number"),
    _ => None,
  }
}

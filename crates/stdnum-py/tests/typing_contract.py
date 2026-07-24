"""Strict consumer-side type contract for the installed Python wheel."""

from typing import assert_type

import stella_stdnum as stdnum

validator_id: stdnum.ValidatorId = "cz.ico"
country: stdnum.CountryCode = "CZ"

assert_type(stdnum.validator_ids(), list[stdnum.ValidatorId])
assert_type(stdnum.validators(), list[stdnum.ValidatorMetadata])
assert_type(stdnum.validator_metadata(validator_id), stdnum.ValidatorMetadata)
assert_type(stdnum.validate(validator_id, "25596641"), stdnum.ValidationResult)
assert_type(stdnum.compact(validator_id, "25596641"), str)
assert_type(stdnum.format(validator_id, "25596641"), str)
assert_type(stdnum.generate(validator_id), str | None)
assert_type(stdnum.parse(validator_id, "25596641"), stdnum.ParsedIdentifier | None)
assert_type(stdnum.credit_card_detect_network("4111111111111111"), stdnum.CardNetwork | None)
assert_type(stdnum.eth_has_valid_eip55_checksum("0x0"), bool)
assert_type(stdnum.btc_base58_decode("1"), bytes | None)
assert_type(stdnum.btc_bech32_polymod([1, 2, 3]), int)
assert_type(stdnum.btc_bech32_convert_bits([1], 5, 8), list[int] | None)
assert_type(stdnum.btc_bech32_validate("bc1q"), stdnum.Bech32Validation)
assert_type(stdnum.be_nn_checksum("85073003328"), int | None)
assert_type(stdnum.es_vat_cif_checksum("A58818501"), int | None)
assert_type(stdnum.ee_ik_two_pass_check("3760503029"), int | None)
assert_type(stdnum.gb_nhs_calc_check_digit("943476591"), int | None)
assert_type(stdnum.gb_sedol_calc_check_digit("026349"), int | None)
assert_type(stdnum.luhn_generate(), str)
assert_type(stdnum.validate_id("cz.ico", "25596641"), bool)
assert_type(stdnum.validate_named_id("ico", "25596641"), bool)

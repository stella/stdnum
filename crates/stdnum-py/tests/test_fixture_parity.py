import json
import unittest
from pathlib import Path

import stella_stdnum


class FixtureParityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        repository = Path(__file__).resolve().parents[3]
        registry_path = repository / "packages/stdnum/registry.json"
        fixture_path = repository / "packages/stdnum/fixtures/parity.json"
        cls.registry = json.loads(registry_path.read_text(encoding="utf-8"))
        cls.fixture_set = json.loads(fixture_path.read_text(encoding="utf-8"))

    def test_registry_contract_matches_python_binding(self) -> None:
        expected_ids = [entry["id"] for entry in self.registry["validators"]]
        self.assertEqual(stella_stdnum.validator_ids(), expected_ids)

        actual = stella_stdnum.validators()
        self.assertEqual(len(actual), len(self.registry["validators"]))
        for expected, metadata in zip(
            self.registry["validators"], actual, strict=True
        ):
            with self.subTest(id=expected["id"]):
                self.assertEqual(metadata.id, expected["id"])
                self.assertEqual(metadata.name, expected["name"])
                self.assertEqual(metadata.local_name, expected["localName"])
                self.assertEqual(metadata.abbreviation, expected["abbreviation"])
                self.assertEqual(metadata.description, expected["description"])
                self.assertEqual(metadata.aliases, expected["aliases"])
                self.assertEqual(
                    metadata.candidate_pattern,
                    expected["candidatePattern"] or "",
                )
                self.assertEqual(metadata.scope, expected["scope"])
                self.assertEqual(metadata.country, expected["country"])
                self.assertEqual(metadata.entity_type, expected["entityType"])
                self.assertEqual(metadata.source_url, expected["sourceUrl"])
                self.assertEqual(metadata.lengths, expected["lengths"])
                self.assertEqual(metadata.examples, expected["examples"])
                self.assertEqual(metadata.can_generate, expected["canGenerate"])
                self.assertEqual(
                    metadata.can_parse,
                    expected["parseKind"] is not None,
                )

    def test_committed_fixtures_match_python_binding(self) -> None:
        for fixture in self.fixture_set["fixtures"]:
            with self.subTest(id=fixture["id"], value=fixture["value"]):
                result = stella_stdnum.validate(fixture["id"], fixture["value"])
                self.assertEqual(result.valid, fixture["expected"])
                self.assertEqual(
                    stella_stdnum.compact(fixture["id"], fixture["value"]),
                    fixture["compact"],
                )
                self.assertEqual(
                    stella_stdnum.format(fixture["id"], fixture["value"]),
                    fixture["format"],
                )

    def test_capabilities_are_callable_from_python(self) -> None:
        for entry in self.registry["validators"]:
            example = next(iter(entry["examples"]), None)
            with self.subTest(id=entry["id"]):
                if entry["canGenerate"]:
                    generated = stella_stdnum.generate(entry["id"])
                    self.assertIsNotNone(generated)
                    self.assertTrue(
                        stella_stdnum.validate(entry["id"], generated).valid
                    )
                if entry["parseKind"] is not None and example is not None:
                    self.assertIsNotNone(stella_stdnum.parse(entry["id"], example))


if __name__ == "__main__":
    unittest.main()

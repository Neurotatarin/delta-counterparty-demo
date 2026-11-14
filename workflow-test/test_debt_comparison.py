import unittest

from debt_comparison import compare_debt


class CompareDebtTests(unittest.TestCase):
    def test_increased_debt(self):
        self.assertEqual(
            compare_debt(100, 150),
            {"status": "increased", "delta": 50},
        )

    def test_decreased_debt(self):
        self.assertEqual(
            compare_debt(150, 100),
            {"status": "decreased", "delta": -50},
        )

    def test_unchanged_debt(self):
        self.assertEqual(
            compare_debt(100, 100),
            {"status": "unchanged", "delta": 0},
        )

    def test_unchanged_zero_debt(self):
        self.assertEqual(
            compare_debt(0, 0),
            {"status": "unchanged", "delta": 0},
        )

    def test_insufficient_data_when_previous_is_none(self):
        self.assertEqual(
            compare_debt(None, 100),
            {"status": "insufficient_data", "delta": None},
        )

    def test_insufficient_data_when_current_is_none(self):
        self.assertEqual(
            compare_debt(100, None),
            {"status": "insufficient_data", "delta": None},
        )

    def test_insufficient_data_when_both_values_are_none(self):
        self.assertEqual(
            compare_debt(None, None),
            {"status": "insufficient_data", "delta": None},
        )

    def test_zero_to_positive_is_increased(self):
        self.assertEqual(
            compare_debt(0, 100),
            {"status": "increased", "delta": 100},
        )

    def test_negative_values_raise_clear_error(self):
        for previous, current in [(-1, 100), (100, -1)]:
            with self.subTest(previous=previous, current=current):
                with self.assertRaisesRegex(ValueError, "non-negative integer"):
                    compare_debt(previous, current)

    def test_bool_values_raise_clear_error(self):
        for previous, current in [(True, 100), (100, False)]:
            with self.subTest(previous=previous, current=current):
                with self.assertRaisesRegex(TypeError, "not bool"):
                    compare_debt(previous, current)

    def test_string_values_raise_clear_error(self):
        for previous, current in [("100", 100), (100, "100")]:
            with self.subTest(previous=previous, current=current):
                with self.assertRaisesRegex(TypeError, "not str"):
                    compare_debt(previous, current)

    def test_float_values_raise_clear_error(self):
        for previous, current in [(100.0, 100), (100, 100.0)]:
            with self.subTest(previous=previous, current=current):
                with self.assertRaisesRegex(TypeError, "not float"):
                    compare_debt(previous, current)


if __name__ == "__main__":
    unittest.main()

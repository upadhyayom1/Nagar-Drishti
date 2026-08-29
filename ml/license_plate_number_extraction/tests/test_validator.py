from src.validation.plate_validator import suggest_corrections, validate_plate

CONFUSIONS = {
    "0": "O", "O": "0", "1": "I", "I": "1", "2": "Z", "Z": "2",
    "5": "S", "S": "5", "8": "B", "B": "8", "6": "G", "G": "6",
}


def test_valid_standard_plate():
    result = validate_plate("UP32AB1234")
    assert result.is_valid
    assert result.plate_type == "standard"
    assert result.state_code == "UP"


def test_valid_plate_other_states():
    for plate in ["DL01AB1234", "MH12CD5678", "KA01MN1234", "TN38AB1234"]:
        result = validate_plate(plate)
        assert result.is_valid, f"{plate} should be valid"


def test_valid_bh_series_plate():
    result = validate_plate("21BH1234AB")
    assert result.is_valid
    assert result.plate_type == "bh_series"


def test_invalid_unknown_state_code():
    result = validate_plate("XX32AB1234")
    assert not result.is_valid


def test_invalid_garbage_text():
    result = validate_plate("HELLOWORLD")
    assert not result.is_valid


def test_invalid_empty_text():
    result = validate_plate("")
    assert not result.is_valid


def test_suggest_corrections_fixes_single_confusable_char():
    # UP32A81234 (8 instead of B) should suggest UP32AB1234
    suggestions = suggest_corrections("UP32A81234", CONFUSIONS)
    assert "UP32AB1234" in suggestions


def test_suggest_corrections_only_returns_format_valid_candidates():
    # Every suggestion returned must itself pass validation -- the function
    # never returns a candidate that doesn't match a known plate format.
    suggestions = suggest_corrections("UP32A81234", CONFUSIONS)
    assert all(validate_plate(s).is_valid for s in suggestions)

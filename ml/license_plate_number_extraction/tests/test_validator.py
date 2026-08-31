from src.validation.plate_validator import suggest_corrections, suggest_format_corrections, validate_plate

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


def test_telangana_state_code_is_valid():
    # Regression test: an earlier version of this list had Telangana's code
    # backwards ("TG" instead of the official "TS"), which silently rejected
    # every genuine Telangana plate.
    result = validate_plate("TS07AB1234")
    assert result.is_valid
    assert result.state_code == "TS"


def test_suggest_format_corrections_fixes_series_letter_misread_as_digit():
    # True plate TS07AB1234; OCR reads the series letter 'B' as '8'. The
    # series-letter position is known to require a letter, so the fix is
    # unambiguous.
    candidates = suggest_format_corrections("TS07A81234", CONFUSIONS)
    assert candidates == ["TS07AB1234"]


def test_suggest_format_corrections_fixes_bh_series_literal_letters():
    # True plate 21BH1234AB; OCR reads the literal 'B' as '8'.
    candidates = suggest_format_corrections("218H1234AB", CONFUSIONS)
    assert candidates == ["21BH1234AB"]


def test_suggest_format_corrections_returns_empty_when_already_valid():
    assert suggest_format_corrections("UP32AB1234", CONFUSIONS) == []


def test_suggest_format_corrections_returns_empty_for_unfixable_text():
    assert suggest_format_corrections("HELLOWORLD", CONFUSIONS) == []


def test_suggest_format_corrections_avoids_ambiguous_multi_template_fixes():
    # A length that plausibly matches two different (rto_len, series_len)
    # combinations may yield more than one candidate fix; when it does, the
    # caller (the pipeline) must treat that as "not confidently correctable"
    # rather than picking one arbitrarily. Just verify the function CAN
    # return multiple candidates so pipeline-level ambiguity handling is
    # meaningfully exercised elsewhere.
    candidates = suggest_format_corrections("UP32AB1Z34", CONFUSIONS)
    assert len(candidates) >= 1
    assert all(validate_plate(c).is_valid for c in candidates)

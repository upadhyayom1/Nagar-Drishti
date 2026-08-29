"""
Unit tests for OCR text normalization.

These tests deliberately avoid instantiating OCREngine (which downloads
EasyOCR's model weights on first use) so the test suite can run fully
offline. Integration-level OCR accuracy should be verified manually against
real footage per README.md 'Testing'.
"""

from src.ocr.ocr_engine import OCREngine


def test_normalize_strips_non_alphanumeric():
    assert OCREngine._normalize("up-32 ab.1234") == "UP32AB1234"


def test_normalize_uppercases():
    assert OCREngine._normalize("dl01ab1234") == "DL01AB1234"


def test_normalize_removes_spaces_and_symbols():
    assert OCREngine._normalize("MH 12 CD-5678!!") == "MH12CD5678"


def test_normalize_empty_string():
    assert OCREngine._normalize("") == ""

"""
Behavioral tests for OCREngine (early-exit variant ordering, small-fragment
filtering) using a fully stubbed `easyocr` module so these run offline and
without downloading any model weights.
"""

import sys
import types

import numpy as np
import pytest


class _FakeReader:
    """Stands in for easyocr.Reader. `script` is a callable the test sets
    per-case to control what `readtext` returns on each call."""

    def __init__(self, *args, **kwargs):
        self.calls = []

    def readtext(self, image, allowlist=None, detail=1, paragraph=False):
        self.calls.append(image)
        return _FakeReader.script(len(self.calls), image)


@pytest.fixture
def ocr_engine_module(monkeypatch):
    fake_easyocr = types.ModuleType("easyocr")
    fake_easyocr.Reader = _FakeReader
    monkeypatch.setitem(sys.modules, "easyocr", fake_easyocr)

    # Force a fresh import so OCREngine picks up the stub even if a real
    # easyocr happens to be importable in this environment.
    sys.modules.pop("src.ocr.ocr_engine", None)
    import src.ocr.ocr_engine as ocr_engine_mod

    return ocr_engine_mod


def _box(height=20, width=50, x0=0):
    return [[x0, 0], [x0 + width, 0], [x0 + width, height], [x0, height]]


def test_read_best_stops_after_first_confident_variant(ocr_engine_module):
    call_count = {"n": 0}

    def script(n, image):
        call_count["n"] = n
        if n == 1:
            return [(_box(), "UP32AB1234", 0.95)]
        return [(_box(), "ZZ00ZZ0000", 0.99)]

    _FakeReader.script = script
    engine = ocr_engine_module.OCREngine(early_stop_confidence=0.90)

    variants = {
        "raw": np.zeros((20, 50, 3), dtype=np.uint8),
        "clahe": np.zeros((20, 50, 3), dtype=np.uint8),
        "adaptive_thresh": np.zeros((20, 50, 3), dtype=np.uint8),
        "sharpened": np.zeros((20, 50, 3), dtype=np.uint8),
        "denoised": np.zeros((20, 50, 3), dtype=np.uint8),
    }
    reading = engine.read_best(variants, frame_index=1, quality_weight=0.9)

    assert reading.text == "UP32AB1234"
    assert reading.variant == "clahe"  # first in priority order
    assert call_count["n"] == 1  # stopped immediately, never tried the rest


def test_read_best_tries_further_variants_when_confidence_is_low(ocr_engine_module):
    def script(n, image):
        if n == 1:
            return [(_box(), "UP32AB1234", 0.40)]  # below early_stop threshold
        return [(_box(), "UP32AB1234", 0.97)]

    _FakeReader.script = script
    engine = ocr_engine_module.OCREngine(early_stop_confidence=0.90, min_confidence=0.1)

    variants = {
        "clahe": np.zeros((20, 50, 3), dtype=np.uint8),
        "raw": np.zeros((20, 50, 3), dtype=np.uint8),
    }
    reading = engine.read_best(variants, frame_index=1, quality_weight=0.9)

    assert reading.confidence == pytest.approx(0.97)
    assert reading.variant == "raw"


def test_small_hologram_fragment_is_filtered_out(ocr_engine_module):
    # Simulate EasyOCR detecting the real plate text (tall boxes) plus a
    # tiny "IND" hologram fragment (much shorter box) above it.
    def script(n, image):
        return [
            (_box(height=8, width=20, x0=0), "IND", 0.6),
            (_box(height=30, width=200, x0=25), "UP32AB1234", 0.9),
        ]

    _FakeReader.script = script
    engine = ocr_engine_module.OCREngine(min_confidence=0.1)
    result = engine.read(np.zeros((30, 250, 3), dtype=np.uint8))

    assert result is not None
    assert result["text"] == "UP32AB1234"


def test_normal_multi_fragment_plate_is_still_concatenated(ocr_engine_module):
    # Two fragments of comparable height (a plate split into two pieces by
    # the text detector) should both be kept and concatenated in order.
    def script(n, image):
        return [
            (_box(height=30, width=80, x0=100), "1234", 0.9),
            (_box(height=30, width=80, x0=0), "UP32AB", 0.9),
        ]

    _FakeReader.script = script
    engine = ocr_engine_module.OCREngine(min_confidence=0.1)
    result = engine.read(np.zeros((30, 250, 3), dtype=np.uint8))

    assert result is not None
    assert result["text"] == "UP32AB1234"

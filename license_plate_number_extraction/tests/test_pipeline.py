"""
Unit tests for the pipeline's pure confidence-scoring logic.

These tests deliberately avoid ANPRPipeline.__init__ (which loads YOLO and
EasyOCR models and may need network access on first run). Instead they
build a bare instance via __new__ and attach only the config dicts the
methods under test actually need.
"""

from src.pipeline.anpr_pipeline import ANPRPipeline

CONF_CFG = {
    "weights": {
        "ocr": 0.40,
        "format_validity": 0.20,
        "char_agreement": 0.20,
        "supporting_frames": 0.10,
        "detector_confidence": 0.10,
    },
    "verified_threshold": 0.85,
    "likely_threshold": 0.60,
    "uncertain_threshold": 0.35,
}
QUALITY_CFG = {"top_k_for_ocr": 8}


def _bare_pipeline():
    pipeline = ANPRPipeline.__new__(ANPRPipeline)
    pipeline.conf_cfg = CONF_CFG
    pipeline.quality_cfg = QUALITY_CFG
    return pipeline


def test_high_confidence_when_all_signals_strong():
    pipeline = _bare_pipeline()
    score = pipeline._compute_confidence(
        ocr_confidence=0.95,
        format_valid=True,
        char_agreement=0.98,
        supporting_frames=8,
        detector_confidence=0.9,
    )
    assert score >= CONF_CFG["verified_threshold"]
    assert pipeline._status_for_confidence(score) == "VERIFIED"


def test_low_confidence_when_all_signals_weak():
    pipeline = _bare_pipeline()
    score = pipeline._compute_confidence(
        ocr_confidence=0.2,
        format_valid=False,
        char_agreement=0.1,
        supporting_frames=1,
        detector_confidence=0.3,
    )
    assert score < CONF_CFG["uncertain_threshold"]
    assert pipeline._status_for_confidence(score) == "UNKNOWN"

def test_status_thresholds_are_monotonic():
    pipeline = _bare_pipeline()
    assert pipeline._status_for_confidence(0.90) == "VERIFIED"
    assert pipeline._status_for_confidence(0.70) == "LIKELY"
    assert pipeline._status_for_confidence(0.40) == "UNCERTAIN"
    assert pipeline._status_for_confidence(0.10) == "UNKNOWN"


def test_confidence_score_is_clamped_between_zero_and_one():
    pipeline = _bare_pipeline()
    score = pipeline._compute_confidence(
        ocr_confidence=1.0,
        format_valid=True,
        char_agreement=1.0,
        supporting_frames=100,
        detector_confidence=1.0,
    )
    assert 0.0 <= score <= 1.0

import cv2
import numpy as np

from src.preprocessing.plate_preprocessor import generate_variants
from src.utils.image_quality import score_plate_crop


def _synthetic_plate(w, h, lines):
    """Build a plain white crop with the given text line(s) drawn on it."""
    img = np.full((h, w, 3), 255, dtype=np.uint8)
    n = len(lines)
    line_h = h // n
    for i, text in enumerate(lines):
        y = int(line_h * (i + 1) * 0.75)
        scale = 0.9 if n == 1 else 0.7
        cv2.putText(img, text, (5, y), cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 2)
    return img


def test_two_line_variant_generated_for_squarish_crop():
    crop = _synthetic_plate(120, 100, ["MH12", "AB1234"])
    variants = generate_variants(crop, target_height=64, sharpness=300.0, contrast=80.0, aspect_ratio=120 / 100)
    assert "two_line" in variants


def test_two_line_variant_not_generated_for_wide_single_line_crop():
    crop = _synthetic_plate(300, 60, ["UP32AB1234"])
    variants = generate_variants(crop, target_height=64, sharpness=300.0, contrast=80.0, aspect_ratio=300 / 60)
    assert "two_line" not in variants


def test_sharp_high_contrast_crop_skips_expensive_variants():
    # A crisp, well-lit crop shouldn't pay for adaptive_thresh/sharpened/denoised.
    crop = _synthetic_plate(300, 60, ["UP32AB1234"])
    variants = generate_variants(crop, target_height=64, sharpness=400.0, contrast=90.0, aspect_ratio=5.0)
    assert "denoised" not in variants
    assert "sharpened" not in variants
    assert "adaptive_thresh" not in variants
    assert "raw" in variants and "clahe" in variants


def test_dark_noisy_crop_generates_denoised_variant():
    crop = _synthetic_plate(300, 60, ["UP32AB1234"])
    variants = generate_variants(crop, target_height=64, sharpness=50.0, contrast=15.0, aspect_ratio=5.0)
    assert "denoised" in variants


def test_generate_variants_without_quality_hints_produces_all_variants():
    # Backward-compatible behavior: if no quality stats are supplied, fall
    # back to generating every variant (safe default).
    crop = _synthetic_plate(300, 60, ["UP32AB1234"])
    variants = generate_variants(crop, target_height=64)
    for name in ("raw", "clahe", "adaptive_thresh", "sharpened", "denoised"):
        assert name in variants


def test_square_plate_aspect_ratio_is_not_penalized():
    # Regression test: two-wheeler plates are close to square and were
    # previously scored as if malformed.
    square_crop = _synthetic_plate(80, 60, ["MH12", "AB1234"])
    wide_crop = _synthetic_plate(300, 60, ["UP32AB1234"])
    square_score = score_plate_crop(square_crop, detector_confidence=0.9, min_width=55, min_height=16)
    wide_score = score_plate_crop(wide_crop, detector_confidence=0.9, min_width=55, min_height=16)
    # Neither shape should be penalized purely for its aspect ratio; both
    # should be able to reach a comparably high overall score.
    assert square_score.overall > 0.3
    assert wide_score.overall > 0.3


def test_implausible_sliver_aspect_ratio_is_still_penalized():
    sliver = np.full((60, 700, 3), 255, dtype=np.uint8)
    score = score_plate_crop(sliver, detector_confidence=0.9, min_width=55, min_height=16)
    assert score.aspect_ratio > 6.5

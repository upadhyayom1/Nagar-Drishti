"""
Image-quality metrics used for best-frame selection.

Every tracked vehicle can generate dozens of plate crops across its
lifetime in frame. Running OCR on all of them is wasteful and noisy,
so each crop is scored and only the best few are ever sent to OCR.
"""

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class QualityScore:
    sharpness: float          # Laplacian variance (higher = sharper)
    brightness: float         # mean pixel intensity, 0-255
    contrast: float           # std-dev of pixel intensity
    width: int
    height: int
    aspect_ratio: float
    skew_angle: float         # estimated rotation of the plate, degrees
    overall: float            # combined 0-1 score used for ranking


def _laplacian_sharpness(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _brightness_contrast(gray: np.ndarray) -> (float, float):
    return float(np.mean(gray)), float(np.std(gray))


def _estimate_skew_angle(gray: np.ndarray) -> float:
    """Estimate the in-plane rotation of the (assumed roughly rectangular)
    plate region using the minimum-area bounding rectangle of its edges."""
    edges = cv2.Canny(gray, 50, 150)
    coords = cv2.findNonZero(edges)
    if coords is None or len(coords) < 10:
        return 0.0
    rect = cv2.minAreaRect(coords)
    angle = rect[-1]
    # cv2.minAreaRect angle convention varies; normalize into [-45, 45]
    if angle < -45:
        angle = 90 + angle
    if angle > 45:
        angle = angle - 90
    return float(angle)


def score_plate_crop(
    crop_bgr: np.ndarray,
    detector_confidence: float,
    min_width: int = 55,
    min_height: int = 16,
) -> QualityScore:
    """Compute a composite quality score in [0, 1] for a candidate plate crop.

    A higher score means the crop is more likely to yield a correct OCR read.
    """
    if crop_bgr is None or crop_bgr.size == 0:
        return QualityScore(0, 0, 0, 0, 0, 0, 0, 0.0)

    h, w = crop_bgr.shape[:2]
    gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY) if crop_bgr.ndim == 3 else crop_bgr

    sharpness = _laplacian_sharpness(gray)
    brightness, contrast = _brightness_contrast(gray)
    skew_angle = _estimate_skew_angle(gray)
    aspect_ratio = w / max(h, 1)

    # --- normalize individual factors into [0, 1] ---------------------------
    size_score = min(1.0, (w / max(min_width, 1)) * (h / max(min_height, 1)) / 4.0)
    sharpness_score = min(1.0, sharpness / 250.0)

    # brightness: penalize very dark (<40) or blown-out (>230) crops
    if brightness < 40:
        brightness_score = brightness / 40.0
    elif brightness > 230:
        brightness_score = max(0.0, 1.0 - (brightness - 230) / 25.0)
    else:
        brightness_score = 1.0

    contrast_score = min(1.0, contrast / 55.0)

    # Most 4-wheeler plates are wide single-line rectangles (~3.5-5:1), but a
    # huge share of Indian traffic is two-wheelers, whose plates are legally
    # squarish two-line plates (~1.0-1.8:1). Both shapes are completely
    # normal and must not be penalized -- only genuinely implausible shapes
    # (near-square noise blobs below 0.8, or absurdly elongated slivers
    # above 6.5) are downweighted.
    if 0.8 <= aspect_ratio <= 6.5:
        aspect_score = 1.0
    else:
        aspect_score = 0.4

    angle_score = max(0.0, 1.0 - abs(skew_angle) / 30.0)

    overall = (
        0.30 * sharpness_score
        + 0.20 * size_score
        + 0.15 * brightness_score
        + 0.15 * contrast_score
        + 0.10 * aspect_score
        + 0.10 * angle_score
    ) * (0.5 + 0.5 * min(1.0, max(0.0, detector_confidence)))

    return QualityScore(
        sharpness=sharpness,
        brightness=brightness,
        contrast=contrast,
        width=w,
        height=h,
        aspect_ratio=aspect_ratio,
        skew_angle=skew_angle,
        overall=float(np.clip(overall, 0.0, 1.0)),
    )


def passes_minimum_quality(score: QualityScore, min_width: int, min_height: int, min_sharpness: float) -> bool:
    """Hard gate applied before a crop is even stored as an observation."""
    return (
        score.width >= min_width
        and score.height >= min_height
        and score.sharpness >= min_sharpness
    )

"""
Plate image preprocessing.

Generates several preprocessing variants of a raw plate crop rather than
blindly applying every technique. Each variant is later OCR'd independently
and the strongest reading is kept -- some techniques help on a grainy
nighttime crop but hurt a crisp daylight crop, so we let OCR performance
decide (see src/ocr/ocr_engine.py: `read_best`).

The un-modified crop is always included as a baseline.
"""

from typing import Dict

import cv2
import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)


def _resize_to_height(img: np.ndarray, target_height: int) -> np.ndarray:
    h, w = img.shape[:2]
    if h == target_height:
        return img
    scale = target_height / float(h)
    new_w = max(1, int(w * scale))
    interp = cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA
    return cv2.resize(img, (new_w, target_height), interpolation=interp)


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Rotate the crop to correct small in-plane skew estimated from edges."""
    edges = cv2.Canny(gray, 50, 150)
    coords = cv2.findNonZero(edges)
    if coords is None or len(coords) < 10:
        return gray
    rect = cv2.minAreaRect(coords)
    angle = rect[-1]
    if angle < -45:
        angle = 90 + angle
    if angle > 45:
        angle = angle - 90
    if abs(angle) < 1.0 or abs(angle) > 20.0:
        return gray  # not worth correcting / likely a bad estimate
    h, w = gray.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(gray, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def generate_variants(crop_bgr: np.ndarray, target_height: int = 64) -> Dict[str, np.ndarray]:
    """Return a dict of {variant_name: image} ready to be passed to OCR.

    Variants:
        raw             - original crop, resized only
        clahe           - grayscale + contrast-limited adaptive histogram equalization
        adaptive_thresh - binarized via adaptive thresholding (helps low-contrast plates)
        sharpened       - unsharp-mask sharpened grayscale (helps motion blur)
        denoised        - fastNlMeans denoised + CLAHE (helps compression artifacts / night noise)
    """
    if crop_bgr is None or crop_bgr.size == 0:
        return {}

    resized = _resize_to_height(crop_bgr, target_height)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if resized.ndim == 3 else resized
    gray = _deskew(gray)

    variants: Dict[str, np.ndarray] = {"raw": resized}

    # --- CLAHE (contrast enhancement) ---------------------------------------
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    clahe_img = clahe.apply(gray)
    variants["clahe"] = cv2.cvtColor(clahe_img, cv2.COLOR_GRAY2BGR)

    # --- Adaptive thresholding (binarization) -------------------------------
    thresh = cv2.adaptiveThreshold(
        clahe_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8
    )
    variants["adaptive_thresh"] = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

    # --- Unsharp mask (helps motion blur / soft focus) ----------------------
    blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=2.0)
    sharpened = cv2.addWeighted(gray, 1.7, blurred, -0.7, 0)
    variants["sharpened"] = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)

    # --- Denoise + re-equalize (helps compression artifacts / night grain) -
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
    denoised = clahe.apply(denoised)
    variants["denoised"] = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)

    return variants

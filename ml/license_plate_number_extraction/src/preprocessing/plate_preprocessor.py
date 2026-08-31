"""
Plate image preprocessing.

Generates preprocessing variants of a raw plate crop, but -- unlike the
original implementation, which always ran all 5 variants through OCR no
matter what -- variant generation here is ADAPTIVE: cheap image statistics
(already computed once by src/utils/image_quality.py) decide which variants
are actually worth generating for a given crop, and the expensive ones
(denoising in particular) are skipped unless the crop shows the specific
symptom they fix. Combined with the early-exit logic in
`src/ocr/ocr_engine.py:read_best`, this is the main lever that cuts the
number of OCR forward passes per plate from ~5 down to typically 1-3
without giving up accuracy on genuinely hard crops.

A dedicated `two_line` variant is also produced for squarish crops, because
a large share of Indian traffic is two-wheelers whose plates are legally
laid out as two stacked lines (state+RTO on top, series+number below).
Naively OCR-ing such a plate as one wide line -- or concatenating fragments
purely by x-position, as a single-line reader does -- interleaves the two
rows into garbage. Splitting top/bottom and reading each half separately,
then joining top-then-bottom, fixes this common failure mode.

The un-modified crop is always included as a baseline.
"""

from typing import Dict, Optional

import cv2
import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)

# A plate crop this square-ish (or more) is treated as a two-line-plate
# candidate. Standard single-line plates are typically 3-5:1; a large chunk
# of Indian two-wheeler plates are close to 1:1-1.8:1.
TWO_LINE_ASPECT_THRESHOLD = 2.1


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


def _split_two_line(gray: np.ndarray) -> Optional[np.ndarray]:
    """For a squarish crop that plausibly holds two stacked text rows, find
    the horizontal 'gap' band between rows using the row-wise dark-pixel
    projection profile, split there, and stitch top-then-bottom into one
    wide single-line image so it can be OCR'd by the same left-to-right
    reader used for standard plates.

    Returns None if no plausible gap is found (e.g. the crop really is a
    single line despite its aspect ratio), so callers can simply skip the
    variant rather than feed OCR a garbled image.
    """
    h, w = gray.shape[:2]
    if h < 16:
        return None

    # Binarize so text strokes are foreground (dark text -> high value here).
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    row_ink = binary.sum(axis=1).astype(np.float64)

    # The gap between the two rows is a band of low ink density roughly in
    # the middle third of the crop (avoids picking the quiet margin at the
    # very top/bottom instead of the real inter-row gap).
    band_lo, band_hi = int(h * 0.30), int(h * 0.70)
    if band_hi <= band_lo:
        return None
    band = row_ink[band_lo:band_hi]
    if band.max(initial=0) == 0:
        return None
    split_row = band_lo + int(np.argmin(band))

    top = gray[:split_row, :]
    bottom = gray[split_row:, :]
    if top.shape[0] < 6 or bottom.shape[0] < 6:
        return None

    # Normalize both halves to the same height, then place side-by-side
    # (rather than stacked) so a standard left-to-right text reader consumes
    # "top row characters, then bottom row characters" in the correct order.
    row_h = max(top.shape[0], bottom.shape[0])
    top_r = cv2.resize(top, (int(top.shape[1] * row_h / top.shape[0]), row_h), interpolation=cv2.INTER_CUBIC)
    bottom_r = cv2.resize(bottom, (int(bottom.shape[1] * row_h / bottom.shape[0]), row_h), interpolation=cv2.INTER_CUBIC)
    gap = np.full((row_h, max(4, row_h // 4)), 255, dtype=gray.dtype)
    return np.hstack([top_r, gap, bottom_r])


def generate_variants(
    crop_bgr: np.ndarray,
    target_height: int = 64,
    sharpness: Optional[float] = None,
    contrast: Optional[float] = None,
    aspect_ratio: Optional[float] = None,
) -> Dict[str, np.ndarray]:
    """Return a dict of {variant_name: image} ready to be passed to OCR.

    Which variants are produced is ADAPTIVE on the crop's own quality stats
    (when provided by the caller -- see src/utils/image_quality.py) so
    cheap, well-focused daylight crops don't pay for expensive processing
    they don't need:

        raw             - original crop, resized only. Always produced.
        clahe           - contrast-limited adaptive histogram equalization.
                          Always produced; cheap and rarely hurts.
        adaptive_thresh - binarized via adaptive thresholding. Skipped when
                          contrast is already high (raw/clahe suffice).
        sharpened       - unsharp-mask sharpened. Skipped when the crop is
                          already sharp.
        denoised        - fastNlMeans denoise + CLAHE. The most expensive
                          variant by far; only produced when the crop is
                          both dark/noisy-looking AND not already sharp
                          (denoising a crisp crop mostly just softens it).
        two_line        - top/bottom row split, stitched side-by-side.
                          Produced only for squarish crops that plausibly
                          hold a stacked two-line plate (common on Indian
                          two-wheelers).
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

    is_sharp = sharpness is not None and sharpness >= 180.0
    is_low_contrast = contrast is not None and contrast < 35.0
    is_noisy_or_dark = contrast is not None and contrast < 30.0

    # --- Adaptive thresholding (binarization) -------------------------------
    # Helps low-contrast plates; adds little (and can hurt) on plates that
    # already have strong contrast, so skip it when contrast is known-good.
    if contrast is None or is_low_contrast or not is_sharp:
        thresh = cv2.adaptiveThreshold(
            clahe_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8
        )
        variants["adaptive_thresh"] = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)

    # --- Unsharp mask (helps motion blur / soft focus) ----------------------
    if sharpness is None or not is_sharp:
        blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=2.0)
        sharpened = cv2.addWeighted(gray, 1.7, blurred, -0.7, 0)
        variants["sharpened"] = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)

    # --- Denoise + re-equalize (helps compression artifacts / night grain) -
    # By far the slowest OpenCV call in this module; only worth it when the
    # crop actually looks noisy/dark rather than just soft.
    if sharpness is None or (is_noisy_or_dark and not is_sharp):
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
        denoised = clahe.apply(denoised)
        variants["denoised"] = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)

    # --- Two-line split (Indian two-wheeler plates) -------------------------
    ratio = aspect_ratio if aspect_ratio is not None else (resized.shape[1] / max(resized.shape[0], 1))
    if ratio <= TWO_LINE_ASPECT_THRESHOLD:
        two_line = _split_two_line(clahe_img)
        if two_line is not None:
            variants["two_line"] = cv2.cvtColor(two_line, cv2.COLOR_GRAY2BGR)

    return variants

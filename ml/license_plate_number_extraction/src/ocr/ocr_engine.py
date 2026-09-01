"""
OCR engine.

Model choice: EasyOCR.

Rationale (see README.md section "Model Selection" for the full comparison):
    - PaddleOCR is often marginally more accurate on dense Asian-script text,
      but its installation (paddlepaddle + paddleocr) is comparatively fragile
      across platforms/CUDA versions and its API changes frequently.
    - Tesseract is CPU-only, lightweight, and installs reliably, but its
      accuracy on small, low-contrast, angled CCTV plate crops is
      consistently weaker than deep-learning-based OCR in practice, and it
      has no native confidence-per-character output usable for fusion.
    - EasyOCR (CRAFT text detector + CRNN recognizer) gives strong accuracy
      on short alphanumeric strings, runs on both CPU and GPU through plain
      PyTorch (already a dependency for YOLOv8), installs with a single
      `pip install easyocr`, and returns per-reading confidence scores that
      this system's fusion stage relies on directly.

The engine is restricted to an allowlist of characters (A-Z, 0-9) since
license plates never contain lowercase letters or punctuation, which both
speeds up decoding and eliminates a whole class of OCR errors.
"""

import re
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)

_CLEAN_RE = re.compile(r"[^A-Z0-9]")


@dataclass
class OCRReading:
    text: str
    confidence: float
    variant: str          # which preprocessing variant produced this reading
    frame_index: int
    quality_weight: float  # image-quality score of the source crop (0-1)


class OCREngine:
    # Variants ordered by (cost, typical usefulness): cheap/generally-useful
    # ones are tried first so early-exit (below) can skip the rest of the
    # list -- including the expensive "denoised" variant -- as soon as a
    # confident reading is already in hand.
    _VARIANT_PRIORITY = ["clahe", "raw", "two_line", "adaptive_thresh", "sharpened", "denoised"]

    def __init__(
        self,
        languages: Optional[List[str]] = None,
        gpu: bool = False,
        allowlist: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        min_confidence: float = 0.35,
        min_text_length: int = 4,
        max_text_length: int = 13,
        early_stop_confidence: float = 0.90,
    ):
        try:
            import easyocr
        except ImportError as exc:
            raise ImportError("easyocr is required for OCR. Install it with `pip install easyocr`.") from exc

        logger.info(f"Loading EasyOCR (languages={languages or ['en']}, gpu={gpu})...")
        self.reader = easyocr.Reader(languages or ["en"], gpu=gpu, verbose=False)
        self.allowlist = allowlist
        self.min_confidence = min_confidence
        self.min_text_length = min_text_length
        self.max_text_length = max_text_length
        # As soon as a variant produces a reading at/above this confidence,
        # stop trying the remaining (more expensive) variants for this crop.
        # This is the main lever that keeps average OCR calls per plate close
        # to 1-2 instead of always paying for every variant.
        self.early_stop_confidence = early_stop_confidence

    @staticmethod
    def _normalize(text: str) -> str:
        return _CLEAN_RE.sub("", text.upper())

    def read(self, image: np.ndarray) -> Optional[Dict]:
        """Run OCR on a single image and return the best (text, confidence)
        pair, or None if nothing plausible was found."""
        try:
            results = self.reader.readtext(image, allowlist=self.allowlist, detail=1, paragraph=False)
        except Exception as exc:
            logger.warning(f"OCR failed on a crop: {exc}")
            return None

        if not results:
            return None

        # A plate crop can yield multiple text fragments -- most commonly
        # the actual plate characters split into pieces, but occasionally a
        # small "IND" hologram / state-emblem watermark printed above the
        # main text on many Indian plates. Those emblem fragments are
        # reliably much smaller (lower box height) than the real plate
        # characters, so drop any fragment under half the median box height
        # before concatenating -- otherwise a stray "IND" silently inflates
        # the reading with 2-3 extra wrong characters.
        def _box_height(pts):
            ys = [p[1] for p in pts]
            return max(ys) - min(ys)

        heights = [_box_height(r[0]) for r in results]
        median_h = float(np.median(heights)) if heights else 0.0
        if median_h > 0:
            results = [r for r, h in zip(results, heights) if h >= 0.5 * median_h] or results

        # Concatenate the surviving fragments left-to-right by x-position,
        # since EasyOCR sometimes splits a single plate string into pieces.
        results.sort(key=lambda r: min(pt[0] for pt in r[0]))
        combined_text = "".join(self._normalize(r[1]) for r in results)
        avg_conf = float(np.mean([r[2] for r in results]))

        if not (self.min_text_length <= len(combined_text) <= self.max_text_length):
            return None
        if avg_conf < self.min_confidence:
            return None

        return {"text": combined_text, "confidence": avg_conf}

    def read_best(self, variants: Dict[str, np.ndarray], frame_index: int, quality_weight: float) -> Optional[OCRReading]:
        """Run OCR across the available preprocessing variants of one crop
        and keep the single best (highest-confidence) reading, trying
        variants in cheapest-first / generally-most-useful-first order and
        stopping as soon as a sufficiently confident reading is found.

        This implements the 'do not blindly apply every technique'
        requirement two ways: (1) `generate_variants` already only produces
        the variants that make sense for this crop's own quality stats, and
        (2) here, we stop calling OCR at all on the remaining variants once
        we already have a confident-enough reading -- so a crisp daylight
        plate typically costs 1 OCR call instead of paying for all 5+."""
        ordered_names = [n for n in self._VARIANT_PRIORITY if n in variants]
        ordered_names += [n for n in variants if n not in self._VARIANT_PRIORITY]

        best: Optional[OCRReading] = None
        for variant_name in ordered_names:
            result = self.read(variants[variant_name])
            if result is None:
                continue
            if best is None or result["confidence"] > best.confidence:
                best = OCRReading(
                    text=result["text"],
                    confidence=result["confidence"],
                    variant=variant_name,
                    frame_index=frame_index,
                    quality_weight=quality_weight,
                )
            if best.confidence >= self.early_stop_confidence:
                break
        return best

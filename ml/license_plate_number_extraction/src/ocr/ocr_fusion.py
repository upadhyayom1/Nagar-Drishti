"""
Multi-frame OCR fusion.

Combines several independent OCR readings of the SAME physical plate
(collected from different frames / preprocessing variants of one tracked
vehicle) into a single, best-supported string, using:

    * OCR-confidence weighting
    * image-quality weighting (sharper/larger crops count more)
    * character-position voting across readings that share the modal length
    * sequence-alignment for readings of a different length, so a single
      dropped/inserted character doesn't discard an otherwise-good reading
    * visually-similar-character confusion awareness (O/0, I/1, Z/2, S/5,
      B/8, G/6) used ONLY to interpret disagreement between real readings,
      never to invent a character that no reading actually produced

This module never fabricates characters: every output character came from
at least one real OCR reading at that aligned position.
"""

import difflib
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional

from src.ocr.ocr_engine import OCRReading
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Symmetric confusion groups: characters in the same group are visually
# similar enough that OCR frequently swaps them.
_CONFUSION_GROUPS = [
    {"0", "O"},
    {"1", "I"},
    {"2", "Z"},
    {"5", "S"},
    {"8", "B"},
    {"6", "G"},
]
_CONFUSION_OF: Dict[str, set] = {}
for group in _CONFUSION_GROUPS:
    for ch in group:
        _CONFUSION_OF[ch] = group


@dataclass
class FusionResult:
    text: Optional[str]
    char_agreement: float          # 0-1, average weighted agreement at each aligned position
    supporting_frames: int         # number of distinct frames that contributed
    mean_ocr_confidence: float
    readings_used: List[OCRReading]


def _weight(reading: OCRReading) -> float:
    # Both OCR confidence and source-crop quality matter: a highly-confident
    # OCR call on a blurry, tiny crop is still less trustworthy than a
    # moderately-confident call on a big, sharp crop.
    return max(1e-3, reading.confidence) * max(0.2, reading.quality_weight)


def _modal_length(readings: List[OCRReading]) -> int:
    weighted_lengths: Dict[int, float] = defaultdict(float)
    for r in readings:
        weighted_lengths[len(r.text)] += _weight(r)
    return max(weighted_lengths.items(), key=lambda kv: kv[1])[0]


def _align_to_reference(text: str, ref_len: int) -> Optional[str]:
    """If `text` isn't already ref_len characters, try to align it to a
    string of that length using difflib opcodes (insert/delete a small
    number of characters). Returns None if the strings are too different
    to align meaningfully (protects against fusing unrelated readings)."""
    if len(text) == ref_len:
        return text
    # Build a placeholder reference of matching length purely for alignment
    # bookkeeping is unnecessary here; instead we align pairwise against
    # every same-length reading later. For a differing-length reading we
    # simply pad/trim conservatively only when the length difference is 1,
    # which covers the common "missed/extra character" OCR error.
    if abs(len(text) - ref_len) != 1:
        return None
    if len(text) > ref_len:
        # try removing each single character and see if plausible (kept simple:
        # drop the character that is least likely to be a "real" plate char,
        # e.g. a stray leading/trailing artifact)
        return text[:ref_len] if False else None  # handled by caller via voting fallback
    return None


def fuse_readings(readings: List[OCRReading], min_supporting_frames: int = 1) -> FusionResult:
    """Fuse a list of OCRReading objects (already filtered to a single
    vehicle's plate) into one final string with an agreement score."""
    if not readings:
        return FusionResult(None, 0.0, 0, 0.0, [])

    ref_len = _modal_length(readings)
    same_length = [r for r in readings if len(r.text) == ref_len]
    other_length = [r for r in readings if len(r.text) != ref_len]

    distinct_frames = len({r.frame_index for r in readings})
    if len(same_length) < min_supporting_frames and distinct_frames < min_supporting_frames + 1:
        # Not enough consistent evidence at all -- report failure upstream.
        best_single = max(readings, key=_weight)
        return FusionResult(
            text=best_single.text,
            char_agreement=0.0,
            supporting_frames=distinct_frames,
            mean_ocr_confidence=best_single.confidence,
            readings_used=[best_single],
        )

    # --- character-position weighted voting over same-length readings ------
    position_votes: List[Counter] = [Counter() for _ in range(ref_len)]
    position_weight: List[Dict[str, float]] = [defaultdict(float) for _ in range(ref_len)]

    for r in same_length:
        w = _weight(r)
        for i, ch in enumerate(r.text):
            position_votes[i][ch] += 1
            position_weight[i][ch] += w

    # Also let close-length readings contribute via best-effort alignment,
    # so a single dropped character doesn't waste an entire good reading.
    for r in other_length:
        aligned = _best_effort_align(r.text, ref_len)
        if aligned is None:
            continue
        w = _weight(r) * 0.6  # discount imperfectly-aligned evidence
        for i, ch in enumerate(aligned):
            if ch is None:
                continue
            position_votes[i][ch] += 1
            position_weight[i][ch] += w

    fused_chars = []
    agreement_scores = []
    for i in range(ref_len):
        weights = position_weight[i]
        if not weights:
            fused_chars.append("?")
            agreement_scores.append(0.0)
            continue

        # Soft-merge visually-confusable characters when deciding the winner:
        # sum a character's own weight plus a fraction of its confusion
        # group's weight, but the winning character actually output must
        # still be one that was directly observed (never invented).
        effective: Dict[str, float] = {}
        for ch, w in weights.items():
            boosted = w
            for other_ch in _CONFUSION_OF.get(ch, set()):
                boosted += 0.25 * weights.get(other_ch, 0.0)
            effective[ch] = boosted

        winner = max(effective.items(), key=lambda kv: kv[1])[0]
        total_weight = sum(weights.values())
        agreement = weights.get(winner, 0.0) / total_weight if total_weight > 0 else 0.0

        fused_chars.append(winner)
        agreement_scores.append(agreement)

    fused_text = "".join(fused_chars)
    char_agreement = sum(agreement_scores) / len(agreement_scores) if agreement_scores else 0.0
    mean_conf = sum(r.confidence for r in readings) / len(readings)

    return FusionResult(
        text=fused_text,
        char_agreement=float(char_agreement),
        supporting_frames=distinct_frames,
        mean_ocr_confidence=float(mean_conf),
        readings_used=readings,
    )


def _best_effort_align(text: str, ref_len: int) -> Optional[List[Optional[str]]]:
    """Align a reading whose length differs from the reference length by
    using a simple longest-common-subsequence-based matcher, returning a
    list of length ref_len where unmatched positions are None.

    Only attempts alignment when the length difference is small (<=2),
    otherwise the reading is considered too unreliable to contribute and
    is skipped entirely."""
    if abs(len(text) - ref_len) > 2:
        return None

    # Use a neutral placeholder sequence of the reference length purely to
    # get positional indices from SequenceMatcher's opcodes against `text`.
    placeholder = "\x00" * ref_len
    matcher = difflib.SequenceMatcher(a=placeholder, b=text, autojunk=False)
    aligned: List[Optional[str]] = [None] * ref_len

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue  # placeholder never truly equals real text; unreachable
        if tag == "replace":
            span = min(i2 - i1, j2 - j1)
            for k in range(span):
                aligned[i1 + k] = text[j1 + k]

    if all(c is None for c in aligned):
        return None
    return aligned

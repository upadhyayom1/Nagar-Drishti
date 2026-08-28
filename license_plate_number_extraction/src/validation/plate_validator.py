"""
Indian license-plate format validation.

Supports the standard Indian registration format used across all states/UTs,
plus the newer pan-India "BH-series" format. Validation is treated strictly
as EVIDENCE that feeds the confidence score -- it is never used to invent or
"correct" characters into a plate that matches a format merely because a
valid-looking registration exists (see FINAL OBJECTIVE: never hallucinate).

Standard format:  SS RR LLL NNNN   (spaces are never present in the OCR text)
    SS   - 2-letter state/UT code            e.g. UP, DL, MH, KA, TN
    RR   - 1-2 digit RTO code                 e.g. 32, 01, 12
    LLL  - 0-3 letter series code             e.g. AB, A, CD  (0 letters is rare but valid, e.g. bikes)
    NNNN - 4 digit registration number        e.g. 1234

BH-series format: YY BH NNNN L(L)
    YY   - 2-digit year of registration
    BH   - literal "BH"
    NNNN - 4 digit number
    L(L) - 1-2 letters

Delhi/UT-specific 3-letter state codes and older formats are intentionally
NOT hardcoded to a single state -- the state-code list below covers every
current Indian state and union territory.
"""

import re
from dataclasses import dataclass
from typing import List, Optional

# All current Indian state / union-territory RTO codes.
INDIAN_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TG",
    "TR", "UP", "UK", "WB",  # states
    "AN", "CH", "DH", "DD", "DL", "JK", "LA", "LD", "PY",  # union territories
    "OR",  # legacy code for Odisha still seen on older plates
}

_STANDARD_RE = re.compile(
    r"^(?P<state>[A-Z]{2})(?P<rto>\d{1,2})(?P<series>[A-Z]{0,3})(?P<number>\d{4})$"
)
_BH_RE = re.compile(r"^(?P<year>\d{2})BH(?P<number>\d{4})(?P<series>[A-Z]{1,2})$")


@dataclass
class ValidationResult:
    is_valid: bool
    plate_type: Optional[str]     # "standard" | "bh_series" | None
    state_code: Optional[str]
    reason: str


def validate_plate(text: str) -> ValidationResult:
    """Validate a cleaned (uppercase, alphanumeric-only) OCR string against
    known Indian plate formats. Does not mutate `text` in any way."""
    if not text:
        return ValidationResult(False, None, None, "empty text")

    text = text.strip().upper()

    bh_match = _BH_RE.match(text)
    if bh_match:
        return ValidationResult(True, "bh_series", None, "matches BH-series format")

    std_match = _STANDARD_RE.match(text)
    if std_match:
        state = std_match.group("state")
        if state in INDIAN_STATE_CODES:
            return ValidationResult(True, "standard", state, "matches standard state-coded format")
        return ValidationResult(False, None, state, f"unrecognized state/UT code '{state}'")

    return ValidationResult(False, None, None, "does not match any known Indian plate format")


def suggest_corrections(text: str, confusions: dict) -> List[str]:
    """Given a rejected string, propose alternative strings obtained by
    swapping ONE character at a time through its known visual-confusion
    partner (e.g. '8'<->'B'), returning only alternatives that pass
    `validate_plate`.

    IMPORTANT: this is used only to help SURFACE a likely correction for a
    human reviewer / for confidence scoring; the pipeline never silently
    substitutes a suggested correction into the reported plate number
    without independent supporting evidence from other frames.
    """
    suggestions = []
    for i, ch in enumerate(text):
        alt = confusions.get(ch)
        if not alt or alt == ch:
            continue
        candidate = text[:i] + alt + text[i + 1 :]
        if validate_plate(candidate).is_valid:
            suggestions.append(candidate)
    return suggestions

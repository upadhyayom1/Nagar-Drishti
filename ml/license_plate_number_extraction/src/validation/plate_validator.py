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
# NOTE: Telangana's official RTO code is "TS" (Government of India / Ministry
# of Road Transport & Highways / Parivahan Sewa). "TG" is sometimes seen used
# informally but is NOT the code that appears on registration plates -- an
# earlier version of this list had this backwards, which caused every
# genuine Telangana plate to be rejected as "unrecognized state code". Both
# are kept here (TS as the real one, TG tolerated defensively) so a correct
# reading is never rejected.
INDIAN_STATE_CODES = {
    "AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL",
    "MP", "MH", "MN", "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS",
    "TG",  # informal/legacy variant of Telangana's code, tolerated defensively
    "TR", "UP", "UK", "WB",  # states
    "AN", "CH", "DH", "DN", "DD", "DL", "JK", "LA", "LD", "PY",  # union territories
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


def _standard_templates_for_length(length: int) -> List[str]:
    """Return every plausible per-position type template ('L'=letter,
    'D'=digit) of the standard SS-RR-LLL-NNNN format that has exactly
    `length` characters. A given length can match more than one template
    (e.g. length 10 could be rto=1/series=3 or rto=2/series=2), so all are
    returned and tried independently."""
    templates = []
    for rto_len in (1, 2):
        for series_len in (0, 1, 2, 3):
            if 2 + rto_len + series_len + 4 == length:
                templates.append("LL" + "D" * rto_len + "L" * series_len + "DDDD")
    return templates


def _bh_template_for_length(length: int) -> List[str]:
    """YY-BH-NNNN-L(L): 2 digits + the literal letters 'BH' + 4 digits +
    1-2 letters. 'B' and 'H' are encoded literally (not as generic 'L')
    since a correction must land on those exact letters, not just any
    letter, to be a real BH-series match."""
    templates = []
    for series_len in (1, 2):
        if 2 + 2 + 4 + series_len == length:
            templates.append("DD" + "BH" + "DDDD" + "L" * series_len)
    return templates


def suggest_format_corrections(text: str, confusions: dict, max_corrections: int = 2) -> List[str]:
    """Template-aware correction: unlike `suggest_corrections` (which tries
    one swap anywhere in the string), this uses the fact that every position
    in a known Indian plate format has a KNOWN expected character class
    (letter or digit) -- e.g. the last four characters of a standard plate
    are always digits, the first two are always letters. When the OCR text
    is one or two positions away from matching a valid template purely via
    known visual confusions (0<->O, 1<->I, 2<->Z, 5<->S, 8<->B, 6<->G), this
    proposes the corrected string(s).

    This still never invents a character from nothing: every substitution
    replaces an observed character with its documented visual-confusion
    partner only, and only when doing so is *required* to match the
    expected letter/digit class at that position. Results are capped to
    `max_corrections` substitutions to avoid guessing a plate that bears
    little resemblance to what was actually read.
    """
    text = text.strip().upper()
    if not text:
        return []
    if validate_plate(text).is_valid:
        # Already matches a real format under its own most-natural parse;
        # never propose "fixing" something that isn't broken, even if a
        # different (rto_len, series_len) segmentation could also match
        # after a spurious substitution.
        return []

    templates = _standard_templates_for_length(len(text)) + _bh_template_for_length(len(text))
    if not templates:
        return []

    results = set()
    for template in templates:
        chars = list(text)
        n_fixed = 0
        feasible = True
        for i, (ch, expected) in enumerate(zip(chars, template)):
            if expected in ("L", "D"):
                is_letter = ch.isalpha()
                is_digit = ch.isdigit()
                wants_letter = expected == "L"
                if (wants_letter and is_letter) or (not wants_letter and is_digit):
                    continue  # already matches the expected class
                alt = confusions.get(ch)
                alt_is_letter = alt.isalpha() if alt else False
                if alt and ((wants_letter and alt_is_letter) or (not wants_letter and not alt_is_letter)):
                    chars[i] = alt
                    n_fixed += 1
                else:
                    feasible = False
                    break
            else:
                # Literal expected character (e.g. the 'B'/'H' of BH-series).
                if ch == expected:
                    continue
                alt = confusions.get(ch)
                if alt == expected:
                    chars[i] = alt
                    n_fixed += 1
                else:
                    feasible = False
                    break
            if n_fixed > max_corrections:
                feasible = False
                break
        if feasible and n_fixed > 0:
            candidate = "".join(chars)
            if validate_plate(candidate).is_valid:
                results.add(candidate)

    return sorted(results)

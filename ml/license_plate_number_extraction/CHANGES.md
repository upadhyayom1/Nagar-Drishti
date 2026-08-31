# Changes in this update

## Bug fixes (accuracy)

1. **Telangana state code was backwards.** `INDIAN_STATE_CODES` had `TG`
   instead of the official `TS`, so every genuine Telangana plate was
   silently rejected as "unrecognized state code". Fixed: `TS` is now the
   primary code, `TG` is tolerated defensively.
   (`src/validation/plate_validator.py`)

2. **Two-line plates (very common on Indian two-wheelers) were misread.**
   - `image_quality.py` penalized squarish plates as if malformed (the
     aspect-ratio gate assumed every plate is a single wide line). Widened
     to accept the ~1:1-1.8:1 shape of real two-line plates.
   - A new `two_line` preprocessing variant detects the horizontal gap
     between the two text rows, splits the crop there, and stitches the
     rows side-by-side so a standard left-to-right OCR reader consumes them
     in the correct order (top row, then bottom row) instead of jumbling
     both rows together by raw x-position.
   (`src/utils/image_quality.py`, `src/preprocessing/plate_preprocessor.py`)

3. **"IND" hologram / state-emblem text could get merged into the plate
   reading.** EasyOCR sometimes returns the small hologram text as a
   separate fragment; it's reliably much shorter (box height) than the
   real plate characters, so fragments under half the median box height
   are now dropped before concatenation. (`src/ocr/ocr_engine.py`)

4. **New template-aware auto-correction for Indian formats.** If the fused
   OCR text almost — but not quite — matches a known Indian format, and
   there's a UNIQUE way to get there by swapping an observed character for
   its documented visual-confusion partner (0/O, 1/I, 2/Z, 5/S, 8/B, 6/G)
   at a position whose expected type (letter/digit, or literal 'B'/'H' for
   BH-series) it violates, that correction is now applied. It's never used
   when more than one plausible fix exists (genuine ambiguity is reported
   as read, not guessed at), and the confidence score discounts corrected
   results slightly versus a direct match. (`plate_validator.py`,
   `anpr_pipeline.py`)

## Efficiency fixes

1. **Batched plate detection.** The plate detector previously ran once per
   vehicle per frame in a Python loop (`PlateDetector.detect`), paying
   fixed per-call model overhead per vehicle. `PlateDetector.detect_batch()`
   now runs every vehicle crop in a frame through the model in a single
   forward pass. On busy, multi-vehicle traffic footage this is the
   single biggest speedup.

2. **Adaptive OCR preprocessing.** `generate_variants()` used to always
   generate and OCR all 5 variants (including the very slow
   `fastNlMeansDenoising` denoise step) for every one of the top-K crops
   per vehicle. It now looks at the crop's own sharpness/contrast (already
   computed by the quality scorer) and skips variants that crop doesn't
   need — a crisp daylight plate now typically produces 2 variants instead
   of 5-6.

3. **Early-exit OCR.** `OCREngine.read_best()` tries variants in a
   cheapest-first order and stops as soon as a variant clears
   `ocr.early_stop_confidence` (default 0.90), instead of always running
   every remaining variant through the OCR network. Combined with (2),
   average OCR calls per plate typically drops from ~5-8 to ~1-3.

4. **Stop re-detecting plates on long-lived tracks.** Once a tracked
   vehicle already has `quality.top_k_for_ocr` observations at or above
   `quality.skip_detection_quality` (default 0.75), the plate detector is
   no longer run on further frames of that track — a vehicle idling in
   frame for hundreds of frames gains nothing from yet another
   near-identical high-quality crop.

## New config knobs (`config/config.yaml`)

- `quality.skip_detection_quality`
- `ocr.early_stop_confidence`

## Testing

41 unit tests now pass (up from 20), covering the new format-correction
logic, adaptive preprocessing/two-line splitting, batched plate detection,
and OCR early-exit/fragment-filtering behavior — all fully offline (no
model downloads required to run `pytest tests/`).

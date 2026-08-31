import numpy as np

from src.detection.plate_detector import PlateDetector


def _plate_detector():
    # No weights file present -> falls back to the classical CV heuristic,
    # which is fully offline and safe for unit testing.
    return PlateDetector(weights="does_not_exist.pt", confidence=0.35, iou=0.45, device="cpu")


def test_detect_batch_returns_one_result_list_per_input_crop():
    det = _plate_detector()
    crops = [np.random.randint(0, 255, (200, 300, 3), dtype=np.uint8) for _ in range(4)]
    results = det.detect_batch(crops)
    assert len(results) == len(crops)
    assert all(isinstance(r, list) for r in results)


def test_detect_batch_handles_empty_and_none_crops_without_crashing():
    det = _plate_detector()
    crops = [
        np.random.randint(0, 255, (200, 300, 3), dtype=np.uint8),
        np.zeros((0, 0, 3), dtype=np.uint8),
        None,
    ]
    results = det.detect_batch(crops)
    assert len(results) == 3
    assert results[1] == []
    assert results[2] == []


def test_detect_batch_matches_detect_called_individually():
    # Batched detection (heuristic fallback path) should be equivalent to
    # calling .detect() on each crop one at a time.
    det = _plate_detector()
    rng = np.random.default_rng(42)
    crops = [rng.integers(0, 255, (200, 300, 3), dtype=np.uint8) for _ in range(3)]
    batched = det.detect_batch(crops)
    individually = [det.detect(c) for c in crops]
    assert len(batched) == len(individually)
    for b, ind in zip(batched, individually):
        assert [d.bbox for d in b] == [d.bbox for d in ind]


def test_detect_batch_empty_input_list():
    det = _plate_detector()
    assert det.detect_batch([]) == []

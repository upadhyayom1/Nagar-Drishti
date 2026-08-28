from src.ocr.ocr_engine import OCRReading
from src.ocr.ocr_fusion import fuse_readings


def _reading(text, conf=0.9, frame_index=0, quality=0.9, variant="raw"):
    return OCRReading(text=text, confidence=conf, variant=variant, frame_index=frame_index, quality_weight=quality)


def test_fusion_majority_vote_resolves_single_char_disagreement():
    readings = [
        _reading("UP32AB1234", frame_index=101),
        _reading("UP32AB1234", frame_index=102),
        _reading("UP32A81234", frame_index=103),  # 8 instead of B
        _reading("UP32AB1234", frame_index=104),
        _reading("UP32AB1234", frame_index=105),
    ]
    result = fuse_readings(readings, min_supporting_frames=2)
    assert result.text == "UP32AB1234"
    assert result.supporting_frames == 5
    assert result.char_agreement > 0.7


def test_fusion_never_invents_characters_not_seen():
    # Every position's winner must come from one of the actual readings.
    readings = [
        _reading("DL01AB1234", frame_index=1),
        _reading("DL01AB1234", frame_index=2),
        _reading("DL01CB1234", frame_index=3),
    ]
    result = fuse_readings(readings, min_supporting_frames=1)
    observed_chars_per_position = list(zip("DL01AB1234", "DL01AB1234", "DL01CB1234"))
    for i, ch in enumerate(result.text):
        assert ch in observed_chars_per_position[i]


def test_fusion_weights_higher_quality_readings_more():
    readings = [
        _reading("MH12CD5678", conf=0.95, quality=0.95, frame_index=1),
        _reading("MH12CD5678", conf=0.95, quality=0.95, frame_index=2),
        _reading("MH12ZD5678", conf=0.5, quality=0.2, frame_index=3),  # low quality outlier
    ]
    result = fuse_readings(readings, min_supporting_frames=1)
    assert result.text == "MH12CD5678"


def test_fusion_empty_input_returns_none_text():
    result = fuse_readings([], min_supporting_frames=1)
    assert result.text is None
    assert result.supporting_frames == 0

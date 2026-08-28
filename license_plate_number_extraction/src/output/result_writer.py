"""
Output generation: results.json, results.csv, and annotated frame drawing.
"""

import csv
import json
import os
from dataclasses import asdict, dataclass, field
from typing import List, Optional

import cv2

from src.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class VehicleResult:
    vehicle_id: int
    vehicle_type: str
    plate_number: Optional[str]
    status: str                  # VERIFIED | LIKELY | UNCERTAIN | UNKNOWN
    confidence: float
    frames_used: int
    first_frame: int
    last_frame: int
    reason: Optional[str] = None
    plate_format: Optional[str] = None
    state_code: Optional[str] = None


def write_json(results: List[VehicleResult], path: str):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    payload = {"vehicles": [asdict(r) for r in results]}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    logger.info(f"Wrote JSON results to '{path}' ({len(results)} vehicles).")


def write_csv(results: List[VehicleResult], path: str):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    fieldnames = [
        "vehicle_id", "vehicle_type", "plate_number", "status", "confidence",
        "frames_used", "first_frame", "last_frame", "reason", "plate_format", "state_code",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(asdict(r))
    logger.info(f"Wrote CSV results to '{path}' ({len(results)} vehicles).")


def draw_annotations(frame, vehicle_bbox, vehicle_id, plate_bbox=None, plate_text=None, confidence=None):
    """Draw a vehicle box (+ optional plate box/text/confidence) directly
    onto a frame in-place, returning the same frame for convenience."""
    x1, y1, x2, y2 = vehicle_bbox
    color = (0, 200, 0)
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    label = f"Vehicle #{vehicle_id}"
    cv2.putText(frame, label, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    if plate_bbox is not None:
        px1, py1, px2, py2 = plate_bbox
        cv2.rectangle(frame, (px1, py1), (px2, py2), (0, 165, 255), 2)
        if plate_text:
            text = plate_text
            if confidence is not None:
                text += f" {confidence * 100:.1f}%"
            cv2.putText(frame, text, (px1, max(20, py1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)

    return frame

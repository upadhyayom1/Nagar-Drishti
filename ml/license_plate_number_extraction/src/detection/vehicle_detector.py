"""
Vehicle detection + tracking.

Uses a YOLOv8 model (pretrained on COCO) restricted to vehicle classes
(car, motorcycle, bus, truck), and relies on ultralytics' built-in
ByteTrack / BoT-SORT implementation (`model.track(..., persist=True)`)
to assign persistent track IDs across frames.

Why YOLOv8n for vehicle detection:
    - Real-time on both CPU and GPU, small model size (~6 MB).
    - COCO already includes car/motorcycle/bus/truck classes, so no
      custom training is required for the vehicle-detection stage.
    - ultralytics ships tracker configs (bytetrack.yaml, botsort.yaml)
      that integrate directly with the detector output.
"""

from dataclasses import dataclass
from typing import List, Optional

import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class VehicleDetection:
    track_id: int
    bbox: tuple          # (x1, y1, x2, y2) in the ORIGINAL frame's pixel coordinates
    confidence: float
    class_id: int
    class_name: str


class VehicleDetector:
    def __init__(
        self,
        weights: str,
        vehicle_classes: List[int],
        class_names: dict,
        confidence: float = 0.4,
        iou: float = 0.45,
        device: str = "cpu",
        tracker_config: str = "bytetrack.yaml",
    ):
        try:
            from ultralytics import YOLO
        except ImportError as exc:
            raise ImportError(
                "ultralytics is required for vehicle detection. Install it with "
                "`pip install ultralytics`."
            ) from exc

        logger.info(f"Loading vehicle detector '{weights}' on device '{device}'...")
        self.model = YOLO(weights)
        self.vehicle_classes = vehicle_classes
        self.class_names = class_names
        self.confidence = confidence
        self.iou = iou
        self.device = device
        self.tracker_config = tracker_config
        self._warmed_up = False

    def warm_up(self, frame_shape=(640, 640, 3)):
        """Run one dummy inference so the first real frame isn't slowed
        down by CUDA kernel compilation / lazy weight loading."""
        dummy = np.zeros(frame_shape, dtype=np.uint8)
        self.model.predict(dummy, verbose=False, device=self.device)
        self._warmed_up = True
        logger.info("Vehicle detector warm-up complete.")

    def detect_and_track(self, frame: np.ndarray) -> List[VehicleDetection]:
        """Run detection + tracking on a single frame and return only the
        configured vehicle classes with valid track IDs."""
        results = self.model.track(
            frame,
            persist=True,
            classes=self.vehicle_classes,
            conf=self.confidence,
            iou=self.iou,
            device=self.device,
            tracker=self.tracker_config,
            verbose=False,
        )

        detections: List[VehicleDetection] = []
        if not results:
            return detections

        result = results[0]
        boxes = result.boxes
        if boxes is None or boxes.id is None:
            # Tracker has not yet confirmed any tracks on this frame
            return detections

        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        cls_ids = boxes.cls.cpu().numpy().astype(int)
        track_ids = boxes.id.cpu().numpy().astype(int)

        for box, conf, cls_id, tid in zip(xyxy, confs, cls_ids, track_ids):
            x1, y1, x2, y2 = [max(0, int(v)) for v in box]
            detections.append(
                VehicleDetection(
                    track_id=int(tid),
                    bbox=(x1, y1, x2, y2),
                    confidence=float(conf),
                    class_id=int(cls_id),
                    class_name=self.class_names.get(int(cls_id), str(cls_id)),
                )
            )
        return detections

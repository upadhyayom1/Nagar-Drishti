"""
Dedicated license-plate detector.

Primary path: a YOLOv8 model fine-tuned specifically for license-plate
localization (trained on plates of many aspect ratios / countries / angles).
See README.md "Model Setup" for exactly how to obtain the weights file
referenced by `models.plate_detector` in config.yaml.

Fallback path: if the dedicated weights file is not present, the detector
falls back to a classical OpenCV pipeline (edge detection + morphological
closing + contour filtering by plate-like aspect ratio) applied within the
vehicle ROI. This is a real, working algorithm -- not a stub -- but it is
noticeably less robust than the trained detector on difficult CCTV footage,
and this is logged clearly so the limitation is never silent.
"""

import os
from dataclasses import dataclass
from typing import List

import cv2
import numpy as np

from src.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class PlateDetection:
    bbox: tuple           # (x1, y1, x2, y2) in the coordinate space of the image passed in
    confidence: float
    source: str           # "yolo" or "heuristic" -- surfaced in confidence scoring downstream


class PlateDetector:
    def __init__(self, weights: str, confidence: float = 0.35, iou: float = 0.45, device: str = "cpu"):
        self.confidence = confidence
        self.iou = iou
        self.device = device
        self.model = None
        self.using_fallback = True

        if weights and os.path.isfile(weights):
            try:
                from ultralytics import YOLO
                self.model = YOLO(weights)
                self.using_fallback = False
                logger.info(f"Loaded dedicated plate detector from '{weights}'.")
            except Exception as exc:
                logger.warning(f"Failed to load plate detector weights '{weights}' ({exc}); using heuristic fallback.")
        else:
            logger.warning(
                f"Plate detector weights not found at '{weights}'. Falling back to a classical "
                f"CV heuristic (edges + contour filtering). Accuracy will be noticeably lower on "
                f"difficult CCTV footage -- see README.md 'Model Setup' to install the trained model."
            )

    def warm_up(self, frame_shape=(320, 320, 3)):
        if self.model is not None:
            dummy = np.zeros(frame_shape, dtype=np.uint8)
            self.model.predict(dummy, verbose=False, device=self.device)

    def detect(self, vehicle_crop: np.ndarray) -> List[PlateDetection]:
        if vehicle_crop is None or vehicle_crop.size == 0:
            return []
        if self.model is not None:
            return self._detect_yolo([vehicle_crop])[0]
        return self._detect_heuristic(vehicle_crop)

    def detect_batch(self, vehicle_crops: List[np.ndarray]) -> List[List[PlateDetection]]:
        """Detect plates in several vehicle crops with ONE model call
        instead of one call per crop.

        A single-vehicle-at-a-time `.predict()` call pays fixed per-call
        Python/inference overhead (pre/post-processing, device transfer)
        regardless of how small the crop is. On a busy CCTV frame with a
        dozen vehicles, calling `detect()` in a loop means paying that
        overhead a dozen times per frame. Ultralytics accepts a *list* of
        images and runs them as one batched forward pass, so this is the
        single biggest per-frame efficiency win available for multi-vehicle
        scenes and should always be preferred over looping `detect()`.
        """
        valid = [(i, c) for i, c in enumerate(vehicle_crops) if c is not None and c.size > 0]
        results_per_crop: List[List[PlateDetection]] = [[] for _ in vehicle_crops]
        if not valid:
            return results_per_crop

        if self.model is not None:
            batched = self._detect_yolo([c for _, c in valid])
            for (orig_idx, _), dets in zip(valid, batched):
                results_per_crop[orig_idx] = dets
        else:
            for orig_idx, crop in valid:
                results_per_crop[orig_idx] = self._detect_heuristic(crop)
        return results_per_crop

    # ------------------------------------------------------------------ #
    # YOLO path
    # ------------------------------------------------------------------ #
    def _detect_yolo(self, vehicle_crops: List[np.ndarray]) -> List[List[PlateDetection]]:
        results = self.model.predict(
            vehicle_crops, conf=self.confidence, iou=self.iou, device=self.device, verbose=False
        )
        per_image: List[List[PlateDetection]] = []
        for result in results:
            detections = []
            boxes = result.boxes
            if boxes is not None:
                xyxy = boxes.xyxy.cpu().numpy()
                confs = boxes.conf.cpu().numpy()
                for box, conf in zip(xyxy, confs):
                    x1, y1, x2, y2 = [max(0, int(v)) for v in box]
                    detections.append(PlateDetection(bbox=(x1, y1, x2, y2), confidence=float(conf), source="yolo"))
            per_image.append(detections)
        # ultralytics may return fewer results than inputs only in
        # pathological cases; pad defensively so callers can always zip 1:1.
        while len(per_image) < len(vehicle_crops):
            per_image.append([])
        return per_image

    # ------------------------------------------------------------------ #
    # Classical CV fallback
    # ------------------------------------------------------------------ #
    def _detect_heuristic(self, vehicle_crop: np.ndarray) -> List[PlateDetection]:
        gray = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.bilateralFilter(gray, 11, 17, 17)

        # Emphasize vertical edges (plate characters produce strong vertical
        # gradients), then close horizontally to merge characters into a
        # single plate-shaped blob.
        sobel_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0, ksize=3)
        sobel_x = cv2.convertScaleAbs(sobel_x)
        _, thresh = cv2.threshold(sobel_x, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        closed = cv2.erode(closed, None, iterations=1)
        closed = cv2.dilate(closed, None, iterations=2)

        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        h_img, w_img = gray.shape[:2]
        candidates = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if h == 0 or w == 0:
                continue
            aspect_ratio = w / float(h)
            area_ratio = (w * h) / float(w_img * h_img)

            # Real license plates are wide rectangles occupying a modest
            # fraction of the vehicle bounding box, usually in the lower
            # half of the ROI (front/rear plates are rarely near the roof).
            if (
                2.0 <= aspect_ratio <= 6.0
                and 0.01 <= area_ratio <= 0.35
                and w >= 40
                and h >= 12
                and y > h_img * 0.25
            ):
                # Confidence is a heuristic combining how "plate-shaped" the
                # aspect ratio is and how much of the vertical-edge mass it captures.
                aspect_score = 1.0 - min(1.0, abs(aspect_ratio - 3.2) / 3.2)
                fill = cv2.countNonZero(closed[y : y + h, x : x + w]) / float(w * h)
                conf = float(np.clip(0.25 + 0.4 * aspect_score + 0.35 * fill, 0.0, 0.9))
                candidates.append(PlateDetection(bbox=(x, y, x + w, y + h), confidence=conf, source="heuristic"))

        # Keep only the most plate-like candidate(s), sorted by confidence,
        # and cap the count to avoid flooding OCR with noise.
        candidates.sort(key=lambda d: d.confidence, reverse=True)
        return candidates[:2]

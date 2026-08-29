"""
Per-vehicle track state management.

The YOLO tracker (see src/detection/vehicle_detector.py) supplies persistent
track IDs. This module owns everything that happens PER TRACK across its
lifetime: accumulating plate observations, ranking them by quality, deciding
when a track is "finished" (vehicle left the frame), and handing off the
best observations for OCR + fusion exactly once per vehicle.

This is what prevents "the same vehicle in 300 frames" from producing 300
duplicate results (see FINAL OBJECTIVE / duplicate-suppression requirement).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np

from src.utils.image_quality import QualityScore
from src.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class PlateObservation:
    frame_index: int
    crop_bgr: np.ndarray
    plate_bbox_frame: tuple      # plate bbox in full-frame coordinates
    detector_confidence: float
    quality: QualityScore


@dataclass
class VehicleTrack:
    track_id: int
    class_name: str
    first_frame: int
    last_frame: int
    last_bbox: tuple
    detection_confidences: List[float] = field(default_factory=list)
    observations: List[PlateObservation] = field(default_factory=list)
    finalized: bool = False

    @property
    def mean_detection_confidence(self) -> float:
        if not self.detection_confidences:
            return 0.0
        return float(np.mean(self.detection_confidences))

    def add_observation(self, obs: PlateObservation, max_observations: int):
        self.observations.append(obs)
        if len(self.observations) > max_observations:
            # Drop the lowest-quality observation to bound memory usage
            # while keeping the strongest evidence collected so far.
            self.observations.sort(key=lambda o: o.quality.overall, reverse=True)
            self.observations = self.observations[:max_observations]

    def top_observations(self, k: int) -> List[PlateObservation]:
        ranked = sorted(self.observations, key=lambda o: o.quality.overall, reverse=True)
        return ranked[:k]


class TrackManager:
    """Owns the dictionary of active/finished VehicleTrack objects and applies
    the lost-track timeout that triggers finalization (OCR + fusion) exactly
    once per physical vehicle sighting."""

    def __init__(self, max_lost_frames: int = 45, max_observations_per_vehicle: int = 40):
        self.max_lost_frames = max_lost_frames
        self.max_observations_per_vehicle = max_observations_per_vehicle
        self.tracks: Dict[int, VehicleTrack] = {}
        self._finalized_ids: set = set()

    def update_vehicle(self, track_id: int, class_name: str, bbox: tuple, confidence: float, frame_index: int) -> VehicleTrack:
        track = self.tracks.get(track_id)
        if track is None:
            track = VehicleTrack(
                track_id=track_id,
                class_name=class_name,
                first_frame=frame_index,
                last_frame=frame_index,
                last_bbox=bbox,
            )
            self.tracks[track_id] = track
            logger.info(f"Vehicle {track_id} ({class_name}) detected at frame {frame_index}")
        track.last_frame = frame_index
        track.last_bbox = bbox
        track.detection_confidences.append(confidence)
        return track

    def add_plate_observation(self, track_id: int, obs: PlateObservation):
        track = self.tracks.get(track_id)
        if track is None:
            return
        track.add_observation(obs, self.max_observations_per_vehicle)

    def tracks_to_finalize(self, current_frame_index: int) -> List[VehicleTrack]:
        """Return tracks that have not been seen for > max_lost_frames and
        have not already been finalized."""
        ready = []
        for tid, track in self.tracks.items():
            if track.finalized:
                continue
            if current_frame_index - track.last_frame > self.max_lost_frames:
                track.finalized = True
                ready.append(track)
        return ready

    def remaining_tracks_at_end_of_video(self) -> List[VehicleTrack]:
        """Called once after the video ends: any track still 'active' needs
        to be finalized too (the vehicle simply never left frame)."""
        ready = []
        for tid, track in self.tracks.items():
            if not track.finalized:
                track.finalized = True
                ready.append(track)
        return ready

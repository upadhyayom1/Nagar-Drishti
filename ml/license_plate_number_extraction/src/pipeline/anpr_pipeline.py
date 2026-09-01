"""
End-to-end ANPR pipeline orchestration.

Wires together: video I/O -> vehicle detection/tracking -> plate detection
-> quality-gated observation storage -> (on track finalization) preprocessing
-> OCR -> multi-frame fusion -> validation -> confidence scoring -> output.
"""

import time
from typing import Dict, List, Optional

import cv2
import numpy as np

from src.detection.plate_detector import PlateDetector
from src.detection.vehicle_detector import VehicleDetector
from src.ocr.ocr_engine import OCREngine, OCRReading
from src.ocr.ocr_fusion import fuse_readings
from src.output.result_writer import VehicleResult, draw_annotations, write_csv, write_json
from src.preprocessing.plate_preprocessor import generate_variants
from src.tracking.vehicle_tracker import PlateObservation, TrackManager, VehicleTrack
from src.utils.image_quality import passes_minimum_quality, score_plate_crop
from src.utils.logger import get_logger
from src.utils.video import VideoReader, VideoSourceError, VideoWriter
from src.validation.plate_validator import suggest_format_corrections, validate_plate

logger = get_logger(__name__)


class ANPRPipeline:
    def __init__(self, config: dict, device: str):
        self.config = config
        self.device = device

        models_cfg = config["models"]
        det_cfg = config["detection"]
        track_cfg = config["tracking"]
        quality_cfg = config["quality"]
        pre_cfg = config["preprocessing"]
        ocr_cfg = config["ocr"]
        fusion_cfg = config["fusion"]
        conf_cfg = config["confidence"]

        self.quality_cfg = quality_cfg
        self.pre_cfg = pre_cfg
        self.fusion_cfg = fusion_cfg
        self.conf_cfg = conf_cfg

        logger.info("Loading vehicle detector...")
        self.vehicle_detector = VehicleDetector(
            weights=models_cfg["vehicle_detector"],
            vehicle_classes=models_cfg["vehicle_classes"],
            class_names={int(k): v for k, v in models_cfg["vehicle_class_names"].items()},
            confidence=det_cfg["vehicle_confidence"],
            iou=det_cfg["iou_threshold"],
            device=device,
            tracker_config=track_cfg["tracker_config"],
        )

        logger.info("Loading plate detector...")
        self.plate_detector = PlateDetector(
            weights=models_cfg["plate_detector"],
            confidence=det_cfg["plate_confidence"],
            iou=det_cfg["iou_threshold"],
            device=device,
        )

        logger.info("Loading OCR engine...")
        self.ocr_engine = OCREngine(
            languages=ocr_cfg["languages"],
            gpu=(device == "cuda"),
            allowlist=ocr_cfg["allowlist"],
            min_confidence=ocr_cfg["min_confidence"],
            min_text_length=ocr_cfg["min_text_length"],
            max_text_length=ocr_cfg["max_text_length"],
            early_stop_confidence=ocr_cfg.get("early_stop_confidence", 0.90),
        )

        self.track_manager = TrackManager(
            max_lost_frames=config["video"]["max_lost_frames"],
            max_observations_per_vehicle=quality_cfg["max_observations_per_vehicle"],
        )

        self.results: List[VehicleResult] = []
        # Cache of the last known fused plate text per vehicle_id, used only
        # to keep the annotated video's on-screen label consistent once a
        # vehicle has been finalized mid-video (e.g. it left frame early).
        self._last_known_text: Dict[int, str] = {}

    # ------------------------------------------------------------------ #
    # Warm-up
    # ------------------------------------------------------------------ #
    def warm_up(self):
        logger.info("Warming up models...")
        self.vehicle_detector.warm_up()
        self.plate_detector.warm_up()
        logger.info("Warm-up complete.")

    # ------------------------------------------------------------------ #
    # Per-frame processing
    # ------------------------------------------------------------------ #
    def _process_frame(self, frame: np.ndarray, frame_index: int, annotate: bool, is_image: bool = False) -> np.ndarray:
        vehicles = self.vehicle_detector.detect_and_track(frame)

        # Fallback for close-up plate images where no "vehicle" shape is found
        if not vehicles and is_image:
            from src.detection.vehicle_detector import VehicleDetection
            h, w = frame.shape[:2]
            vehicles = [VehicleDetection(track_id=9999, bbox=(0, 0, w, h), confidence=1.0, class_id=-1, class_name="unknown")]
            logger.debug("No vehicles detected in static image; using full frame as fallback vehicle bounding box.")

        # First pass: update track bookkeeping for every vehicle and decide
        # which vehicles actually need a plate-detector call this frame.
        # Vehicles whose track already has enough strong observations are
        # skipped -- there is nothing to gain from re-detecting the same
        # plate for the 200th time on a vehicle idling at a signal.
        needs_detection: List[int] = []          # indices into `vehicles`
        vehicle_crops: List[Optional[np.ndarray]] = []
        for v in vehicles:
            track = self.track_manager.update_vehicle(
                track_id=v.track_id,
                class_name=v.class_name,
                bbox=v.bbox,
                confidence=v.confidence,
                frame_index=frame_index,
            )
            x1, y1, x2, y2 = v.bbox
            crop = frame[y1:y2, x1:x2]
            vehicle_crops.append(crop if crop.size else None)

            skip = crop.size == 0 or track.has_enough_good_observations(
                self.quality_cfg["top_k_for_ocr"], self.quality_cfg.get("skip_detection_quality", 0.75)
            )
            if not skip:
                needs_detection.append(len(vehicle_crops) - 1)

        # Second pass: ONE batched plate-detector call covering every
        # vehicle in this frame that still needs it, instead of one
        # model call per vehicle (see PlateDetector.detect_batch).
        batch_results: List[List] = [[] for _ in vehicles]
        if needs_detection:
            crops_to_run = [vehicle_crops[i] for i in needs_detection]
            detected = self.plate_detector.detect_batch(crops_to_run)
            for i, dets in zip(needs_detection, detected):
                batch_results[i] = dets

        # Third pass: quality-gate + store observations + annotate.
        for i, v in enumerate(vehicles):
            x1, y1, x2, y2 = v.bbox
            vehicle_crop = vehicle_crops[i]
            plate_detections = batch_results[i]
            best_plate_bbox_frame = None
            best_plate_text_for_overlay = self._last_known_text.get(v.track_id)

            if vehicle_crop is not None and plate_detections:
                best_plate = max(plate_detections, key=lambda d: d.confidence)
                px1, py1, px2, py2 = best_plate.bbox
                plate_crop = vehicle_crop[py1:py2, px1:px2]

                quality = score_plate_crop(
                    plate_crop,
                    detector_confidence=best_plate.confidence,
                    min_width=self.quality_cfg["min_plate_width"],
                    min_height=self.quality_cfg["min_plate_height"],
                )

                if passes_minimum_quality(
                    quality,
                    self.quality_cfg["min_plate_width"],
                    self.quality_cfg["min_plate_height"],
                    self.quality_cfg["min_sharpness"],
                ):
                    obs = PlateObservation(
                        frame_index=frame_index,
                        crop_bgr=plate_crop.copy(),
                        plate_bbox_frame=(x1 + px1, y1 + py1, x1 + px2, y1 + py2),
                        detector_confidence=best_plate.confidence,
                        quality=quality,
                    )
                    self.track_manager.add_plate_observation(v.track_id, obs)
                    logger.debug(f"Vehicle {v.track_id}: plate candidate stored (quality={quality.overall:.2f})")

                best_plate_bbox_frame = (x1 + px1, y1 + py1, x1 + px2, y1 + py2)

            if annotate:
                draw_annotations(
                    frame,
                    vehicle_bbox=v.bbox,
                    vehicle_id=v.track_id,
                    plate_bbox=best_plate_bbox_frame,
                    plate_text=best_plate_text_for_overlay,
                )

        # Finalize any tracks that have been lost for too long.
        for track in self.track_manager.tracks_to_finalize(frame_index):
            self._finalize_track(track)

        return frame

    # ------------------------------------------------------------------ #
    # Track finalization: OCR + fusion + validation + confidence
    # ------------------------------------------------------------------ #
    def _finalize_track(self, track: VehicleTrack):
        top_obs = track.top_observations(self.quality_cfg["top_k_for_ocr"])

        if not top_obs:
            result = VehicleResult(
                vehicle_id=track.track_id,
                vehicle_type=track.class_name,
                plate_number=None,
                status="UNKNOWN",
                confidence=0.0,
                frames_used=0,
                first_frame=track.first_frame,
                last_frame=track.last_frame,
                reason="No plate candidates of sufficient quality were detected.",
            )
            self.results.append(result)
            logger.info(f"Vehicle {track.track_id} final plate: UNKNOWN (no usable plate observations)")
            return

        readings: List[OCRReading] = []
        for obs in top_obs:
            variants = generate_variants(
                obs.crop_bgr,
                target_height=self.pre_cfg["target_height"],
                sharpness=obs.quality.sharpness,
                contrast=obs.quality.contrast,
                aspect_ratio=obs.quality.aspect_ratio,
            )
            reading = self.ocr_engine.read_best(
                variants, frame_index=obs.frame_index, quality_weight=obs.quality.overall
            )
            if reading is not None:
                readings.append(reading)
                logger.info(
                    f"Vehicle {track.track_id} | frame {obs.frame_index} | OCR result: "
                    f"{reading.text} ({reading.confidence * 100:.1f}%, variant={reading.variant})"
                )

        if not readings:
            result = VehicleResult(
                vehicle_id=track.track_id,
                vehicle_type=track.class_name,
                plate_number=None,
                status="UNKNOWN",
                confidence=0.0,
                frames_used=0,
                first_frame=track.first_frame,
                last_frame=track.last_frame,
                reason="Plate regions were detected but OCR could not extract legible text.",
            )
            self.results.append(result)
            logger.info(f"Vehicle {track.track_id} final plate: UNKNOWN (no legible OCR reading)")
            return

        fusion = fuse_readings(readings, min_supporting_frames=self.fusion_cfg["min_supporting_frames"])
        import re
        if fusion.text:
            fusion.text = re.sub(r'[^A-Z0-9]', '', fusion.text.upper())
            
        validation = validate_plate(fusion.text) if fusion.text else None
        format_corrected = False

        # If the raw fused text doesn't match a known Indian format, see if
        # it is uniquely one confusable-character swap away from a valid
        # one (e.g. fused text has a '8' where the standard format's series
        # letters must be a letter -> try 'B'). Only ever act on this when
        # there is EXACTLY one such candidate: if two different templates
        # each propose a different "fix", that's evidence we don't actually
        # know which is right, and the original reading is reported as-is
        # rather than guessed at (never hallucinate a specific correction
        # out of genuine ambiguity).
        if fusion.text and validation and not validation.is_valid:
            candidates = suggest_format_corrections(fusion.text, self.fusion_cfg["char_confusions"])
            if len(candidates) == 1:
                corrected_text = candidates[0]
                corrected_validation = validate_plate(corrected_text)
                logger.info(
                    f"Vehicle {track.track_id}: format-corrected '{fusion.text}' -> "
                    f"'{corrected_text}' (unique confusable-character fix)."
                )
                fusion.text = corrected_text
                validation = corrected_validation
                format_corrected = True

        mean_plate_det_conf = float(np.mean([o.detector_confidence for o in top_obs]))
        overall_confidence = self._compute_confidence(
            ocr_confidence=fusion.mean_ocr_confidence,
            format_valid=bool(validation and validation.is_valid),
            char_agreement=fusion.char_agreement,
            supporting_frames=fusion.supporting_frames,
            detector_confidence=(track.mean_detection_confidence + mean_plate_det_conf) / 2.0,
            format_corrected=format_corrected,
        )

        status = self._status_for_confidence(overall_confidence)

        plate_number = fusion.text if status != "UNKNOWN" else None
        reason = None if plate_number else "Insufficient visual/temporal agreement across frames."
        if plate_number and format_corrected:
            reason = "Plate text auto-corrected from a visually-confusable OCR character to match a valid Indian plate format."

        if plate_number:
            self._last_known_text[track.track_id] = plate_number

        result = VehicleResult(
            vehicle_id=track.track_id,
            vehicle_type=track.class_name,
            plate_number=plate_number,
            status=status,
            confidence=round(overall_confidence, 4),
            frames_used=fusion.supporting_frames,
            first_frame=track.first_frame,
            last_frame=track.last_frame,
            reason=reason,
            plate_format=validation.plate_type if validation else None,
            state_code=validation.state_code if validation else None,
            format_corrected=format_corrected,
        )
        self.results.append(result)
        logger.info(
            f"Vehicle {track.track_id} final plate: {plate_number or 'UNKNOWN'} "
            f"({overall_confidence * 100:.1f}%, status={status}, frames={fusion.supporting_frames})"
        )

    def _compute_confidence(
        self,
        ocr_confidence: float,
        format_valid: bool,
        char_agreement: float,
        supporting_frames: int,
        detector_confidence: float,
        format_corrected: bool = False,
    ) -> float:
        w = self.conf_cfg["weights"]
        frames_score = min(1.0, supporting_frames / max(1, self.quality_cfg["top_k_for_ocr"] / 2))
        # A format match obtained via a unique confusable-character
        # correction is real evidence but slightly less certain than a
        # direct match, since it required inferring one character from
        # format structure rather than reading it outright.
        format_score = 0.0
        if format_valid:
            format_score = 0.85 if format_corrected else 1.0
        score = (
            w["ocr"] * ocr_confidence
            + w["format_validity"] * format_score
            + w["char_agreement"] * char_agreement
            + w["supporting_frames"] * frames_score
            + w["detector_confidence"] * detector_confidence
        )
        return float(np.clip(score, 0.0, 1.0))

    def _status_for_confidence(self, confidence: float) -> str:
        if confidence >= self.conf_cfg["verified_threshold"]:
            return "VERIFIED"
        if confidence >= self.conf_cfg["likely_threshold"]:
            return "LIKELY"
        if confidence >= self.conf_cfg["uncertain_threshold"]:
            return "UNCERTAIN"
        return "UNKNOWN"

    # ------------------------------------------------------------------ #
    # Public entry point
    # ------------------------------------------------------------------ #
    def run(self, source: str, output_cfg: dict, video_cfg: dict, show: bool = False) -> List[VehicleResult]:
        try:
            reader = VideoReader(
                source,
                frame_skip=video_cfg["frame_skip"],
                target_fps=video_cfg["target_fps"],
                resize_width=video_cfg["resize_width"],
            )
        except VideoSourceError as exc:
            logger.error(str(exc))
            raise

        self.warm_up()

        writer: Optional[VideoWriter] = None
        annotate = output_cfg["save_annotated_video"] or show
        if output_cfg["save_annotated_video"]:
            writer = VideoWriter(output_cfg["annotated_video_path"], fps=max(5.0, reader.effective_fps))

        start_time = time.time()
        frame_count = 0
        try:
            logger.info("Processing video...")
            is_image = getattr(reader, 'total_frames', -1) == 1
            for frame_index, frame in reader.frames():
                processed = self._process_frame(frame, frame_index, annotate=annotate, is_image=is_image)
                frame_count += 1

                if writer is not None:
                    writer.write(processed)
                if show:
                    cv2.imshow("ANPR", processed)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        logger.info("Interrupted by user ('q' pressed).")
                        break
        except KeyboardInterrupt:
            logger.info("Interrupted by user (Ctrl+C).")
        finally:
            reader.release()
            if writer is not None:
                writer.release()
            if show:
                cv2.destroyAllWindows()

        # Finalize any vehicles still active when the video ended.
        for track in self.track_manager.remaining_tracks_at_end_of_video():
            self._finalize_track(track)

        elapsed = time.time() - start_time
        logger.info(
            f"Processing complete. {frame_count} frames processed in {elapsed:.1f}s "
            f"({frame_count / max(elapsed, 1e-6):.1f} fps). {len(self.results)} vehicle(s) reported."
        )

        write_json(self.results, output_cfg["json_path"])
        write_csv(self.results, output_cfg["csv_path"])

        return self.results

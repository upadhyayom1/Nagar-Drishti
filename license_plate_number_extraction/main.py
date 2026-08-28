#!/usr/bin/env python3
"""
ANPR System - CLI entry point.

Usage:
    python main.py --source input/traffic.mp4
    python main.py --source input/traffic.mp4 --output output/ --device cuda
    python main.py --source rtsp://192.168.1.10:554/stream --device cpu
    python main.py --source 0 --show                 # webcam
"""

import argparse
import os
import sys

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.pipeline.anpr_pipeline import ANPRPipeline
from src.utils.logger import get_logger, setup_logging
from src.utils.video import VideoSourceError


def parse_args():
    parser = argparse.ArgumentParser(
        description="ANPR System - detect vehicles, read license plates from CCTV video."
    )
    parser.add_argument("--source", required=True, help="Path to a video file, webcam index (e.g. 0), or RTSP/HTTP URL.")
    parser.add_argument("--config", default="config/config.yaml", help="Path to the YAML configuration file.")
    parser.add_argument("--output", default=None, help="Output directory (overrides paths in config.yaml).")
    parser.add_argument("--device", default=None, choices=["cpu", "cuda", "auto"], help="Inference device.")
    parser.add_argument("--conf", type=float, default=None, help="Override vehicle detection confidence threshold.")
    parser.add_argument("--frame-skip", type=int, default=None, help="Override frame-skip sampling rate.")
    parser.add_argument("--show", action="store_true", help="Display a live preview window while processing.")
    parser.add_argument("--save-video", dest="save_video", action="store_true", default=None, help="Force saving the annotated output video.")
    parser.add_argument("--no-save-video", dest="save_video", action="store_false", help="Disable saving the annotated output video.")
    return parser.parse_args()


def load_config(path: str) -> dict:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Configuration file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    if not config:
        raise ValueError(f"Configuration file '{path}' is empty or invalid.")
    return config


def resolve_device(requested: str) -> str:
    if requested in (None, "auto"):
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"
    if requested == "cuda":
        try:
            import torch
            if not torch.cuda.is_available():
                print("[WARN] --device cuda requested but CUDA is not available; falling back to CPU.")
                return "cpu"
        except ImportError:
            print("[WARN] torch not installed; falling back to CPU.")
            return "cpu"
    return requested


def apply_overrides(config: dict, args) -> dict:
    if args.output:
        config["output"]["json_path"] = os.path.join(args.output, "results.json")
        config["output"]["csv_path"] = os.path.join(args.output, "results.csv")
        config["output"]["annotated_video_path"] = os.path.join(args.output, "annotated.mp4")
        config["logging"]["log_file"] = os.path.join(args.output, "anpr.log")
    if args.conf is not None:
        config["detection"]["vehicle_confidence"] = args.conf
    if args.frame_skip is not None:
        config["video"]["frame_skip"] = args.frame_skip
    if args.save_video is not None:
        config["output"]["save_annotated_video"] = args.save_video
    return config


def main():
    args = parse_args()

    try:
        config = load_config(args.config)
    except (FileNotFoundError, ValueError, yaml.YAMLError) as exc:
        print(f"[ERROR] Invalid configuration: {exc}")
        sys.exit(1)

    config = apply_overrides(config, args)

    for path in (
        config["output"]["json_path"],
        config["output"]["csv_path"],
        config["output"]["annotated_video_path"],
        config["logging"]["log_file"],
    ):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    setup_logging(
        level=config["logging"]["level"],
        log_file=config["logging"]["log_file"],
        console=config["logging"]["console"],
    )
    logger = get_logger(__name__)

    device_request = args.device or config.get("device", "auto")
    device = resolve_device(device_request)
    logger.info(f"Using device: {device}")

    try:
        pipeline = ANPRPipeline(config=config, device=device)
    except ImportError as exc:
        logger.error(f"Missing dependency: {exc}")
        sys.exit(1)
    except Exception as exc:
        logger.error(f"Failed to initialize pipeline: {exc}")
        sys.exit(1)

    try:
        results = pipeline.run(
            source=args.source,
            output_cfg=config["output"],
            video_cfg=config["video"],
            show=args.show,
        )
    except VideoSourceError as exc:
        logger.error(str(exc))
        sys.exit(1)
    except Exception as exc:
        logger.exception(f"Unexpected error while processing video: {exc}")
        sys.exit(1)

    print("\n===== ANPR RESULTS =====")
    if not results:
        print("No vehicles were detected in the provided source.")
    for r in results:
        plate = r.plate_number or "UNKNOWN"
        print(f"Vehicle #{r.vehicle_id} ({r.vehicle_type}) -> {plate} -> {r.confidence * 100:.1f}% [{r.status}]")
    print(f"\nJSON:  {config['output']['json_path']}")
    print(f"CSV:   {config['output']['csv_path']}")
    if config["output"]["save_annotated_video"]:
        print(f"Video: {config['output']['annotated_video_path']}")


if __name__ == "__main__":
    main()

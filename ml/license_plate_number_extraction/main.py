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
import re  # Added for optimized OCR constraints

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.pipeline.anpr_pipeline import ANPRPipeline
from src.utils.logger import get_logger, setup_logging
from src.utils.video import VideoSourceError

# ======================================================================
# HIGH-EFFICIENCY INDIAN NUMBER PLATE CONSTRAINTS
# ======================================================================

CLEAN_PATTERN = re.compile(r'[^A-Z0-9]')

# Flexible Pattern: State(2) + RTO(2) + Series(1-3) + Number(4)
# Allows for OCR confusions and series codes that are 1, 2, or 3 letters long.
PLATE_EXTRACTOR = re.compile(
    r'([A-Z0124568]{2})'              # State: 2 chars
    r'([0-9OQDUILTEZASGBP]{2})'       # RTO: 2 numbers 
    r'([A-Z0124568]{1,3})'            # Series: 1 to 3 chars (Fixes the "C" in TM87C5106)
    r'([0-9OQDUILTEZASGBP]{4})'       # Unique Number: 4 numbers
)

NUM_TO_LETTER_TBL = str.maketrans('0124568', 'OIZASGB')
LETTER_TO_NUM_TBL = str.maketrans('OQDUILTEZASGBP', '00001111245689')

# 1. THE WHITELIST: All currently valid Indian State/UT Codes
VALID_STATES = {
    "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "GA", "GJ",
    "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML",
    "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN",
    "TR", "TS", "TG", "UK", "UP", "WB"
}

# 2. THE CORRECTION MAP: Maps invalid OCR confusions to valid states.
STATE_MISMATCH_MAP = {
    # TN (Tamil Nadu)
    "TM": "TN", "TV": "TN", "YN": "TN", "TW": "TN", "TH": "TN", "IN": "TN", "ZN": "TN", "7N": "TN",
    # MH (Maharashtra)
    "NH": "MH", "MN": "MH", "MW": "MH", "WH": "MH", "MR": "MH", "MI": "MH", "MA": "MH",
    # UP (Uttar Pradesh)
    "VP": "UP", "UR": "UP", "UF": "UP", "VF": "UP", "OP": "UP", "DP": "UP", "VR": "UP",
    # DL (Delhi)
    "OL": "DL", "CL": "DL", "QL": "DL", "DI": "DL", "BL": "DL", "GL": "DL",
    # KA (Karnataka)
    "KR": "KA", "XA": "KA", "KN": "KA", "KX": "KA", "XR": "KA",
    # GJ (Gujarat)
    "CJ": "GJ", "CI": "GJ", "CU": "GJ", "OJ": "GJ", "GI": "GJ",
    # RJ (Rajasthan)
    "PJ": "RJ", "RI": "RJ", "FJ": "RJ", "PI": "RJ",
    # MP (Madhya Pradesh)
    "NP": "MP", "MF": "MP", "NF": "MP",
    # WB (West Bengal)
    "VR": "WB", "MB": "WB", "WV": "WB", "VV": "WB", "VVB": "WB",
    # HR (Haryana)
    "HA": "HR", "HK": "HR", "HB": "HR",
    # KL (Kerala)
    "KI": "KL", "XL": "KL", "IL": "KL", "RL": "KL", "AL": "KL",
    # CG (Chhattisgarh)
    "CC": "CG", "GG": "CG", "CO": "CG", "C6": "CG",
    # PB (Punjab)
    "PR": "PB", "FB": "PB", "P8": "PB",
    # OD (Odisha)
    "CD": "OD", "OO": "OD", "QO": "OD", "QD": "OD", "DD": "OD", 
    # TS/TG (Telangana)
    "IS": "TS", "I5": "TS", "T5": "TS", "TC": "TG", "T6": "TG",
    # UK (Uttarakhand)
    "VK": "UK", "UX": "UK", "OK": "UK", "OX": "UK"
}

def enforce_indian_plate_constraints(raw_plate: str) -> str:
    if not raw_plate:
        return ""
        
    plate = CLEAN_PATTERN.sub('', raw_plate.upper())
    
    # Check if plate is between 9 and 11 chars. If not, try to extract a valid pattern.
    if len(plate) < 9 or len(plate) > 11:
        match = PLATE_EXTRACTOR.search(plate)
        if match:
            plate = "".join(match.groups())
        else:
            return plate # Failsafe: return raw OCR if no pattern is found
            
    # We now have a guaranteed 9, 10, or 11 char plate.
    # Dynamic slicing from the front and back handles variable length series codes seamlessly.
    state_clean = plate[:2].translate(NUM_TO_LETTER_TBL)
    rto_clean = plate[2:4].translate(LETTER_TO_NUM_TBL)
    series_clean = plate[4:-4].translate(NUM_TO_LETTER_TBL)
    number_clean = plate[-4:].translate(LETTER_TO_NUM_TBL)
    
    # Apply State Code Correction Logic
    if state_clean not in VALID_STATES:
        state_clean = STATE_MISMATCH_MAP.get(state_clean, state_clean)
    
    # Reject 0000
    if number_clean == '0000':
        number_clean = plate[-4:] 
        
    return state_clean + rto_clean + series_clean + number_clean

# ======================================================================

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
        raw_plate = r.plate_number or "UNKNOWN"
        
        if raw_plate != "UNKNOWN":
            # Apply the optimized OCR correction and state mapping
            corrected_plate = enforce_indian_plate_constraints(raw_plate)
            r.plate_number = corrected_plate
        else:
            corrected_plate = "UNKNOWN"
            
        print(f"Vehicle #{r.vehicle_id} ({r.vehicle_type}) -> {corrected_plate} (Raw: {raw_plate}) -> {r.confidence * 100:.1f}% [{r.status}]")

    print(f"\nJSON:  {config['output']['json_path']}")
    print(f"CSV:   {config['output']['csv_path']}")
    if config["output"]["save_annotated_video"]:
        print(f"Video: {config['output']['annotated_video_path']}")


if __name__ == "__main__":
    main()
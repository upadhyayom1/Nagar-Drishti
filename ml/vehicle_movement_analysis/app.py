import sys
import os
import pandas as pd

# Add the current directory to Python's path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from analytics.movement_analyzer import (
    VehicleMovementAnalyzer,
    analyze_ocr_movement
)


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="Nagar-Drishti Vehicle Movement Analysis API",
    description=(
        "FastAPI service for urban vehicle trajectory tracking, "
        "traffic analysis, speed violation detection, and OCR "
        "vehicle movement analysis."
    ),
    version="1.0.0"
)


# ============================================================
# CORS Configuration
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Data Configuration
# ============================================================

DATA_DIR = os.path.join(BASE_DIR, "data")

DETECTIONS_PATH = os.path.join(DATA_DIR, "detections.csv")
CAMERAS_PATH = os.path.join(DATA_DIR, "cameras.csv")
ROADS_PATH = os.path.join(DATA_DIR, "roads.csv")
ZONES_PATH = os.path.join(DATA_DIR, "zones.csv")


# ============================================================
# Initialize Vehicle Movement Analyzer
# ============================================================

try:
    analyzer = VehicleMovementAnalyzer(
        detections_path=DETECTIONS_PATH,
        cameras_path=CAMERAS_PATH,
        roads_path=ROADS_PATH,
        zones_path=ZONES_PATH
    )
except Exception as e:
    analyzer = None
    print(f"WARNING: Failed to initialize VehicleMovementAnalyzer: {e}")


# ============================================================
# Prepare OCR Movement Analysis Data
# ============================================================

MERGED_DATA = None


@app.on_event("startup")
def load_and_prepare_csv_data():
    """
    Load and merge CSV data required by the OCR movement analysis
    pipeline.
    """

    global MERGED_DATA

    try:
        roads = pd.read_csv(ROADS_PATH)
        zones = pd.read_csv(ZONES_PATH)
        cameras = pd.read_csv(CAMERAS_PATH)
        detections = pd.read_csv(DETECTIONS_PATH)

        # Map detection camera code:
        # C001 -> PRY-CAM-001
        detections["mapped_code"] = detections["cameraCode"].apply(
            lambda c: f"PRY-CAM-{int(c[1:]):03d}"
        )

        # Merge detections with cameras
        merged = detections.merge(
            cameras,
            left_on="mapped_code",
            right_on="cameraCode",
            how="left",
            suffixes=("", "_cam")
        )

        # Merge roads
        merged = merged.merge(
            roads,
            left_on="roadId",
            right_on="id",
            how="left",
            suffixes=("", "_road")
        )

        # Merge zones
        merged = merged.merge(
            zones,
            left_on="zoneId",
            right_on="id",
            how="left",
            suffixes=("", "_zone")
        )

        MERGED_DATA = merged

        print(
            f"OCR movement data initialized successfully: "
            f"{len(MERGED_DATA)} detections loaded."
        )

    except Exception as e:
        MERGED_DATA = None
        print(f"WARNING: Failed to load OCR movement data: {e}")


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Nagar-Drishti Vehicle Movement Analysis Engine API",
        "status": "running"
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if analyzer is not None else "degraded",
        "analyzer_initialized": analyzer is not None,
        "ocr_data_initialized": MERGED_DATA is not None
    }


# ============================================================
# Traffic Summary
# ============================================================

@app.get("/api/summary")
def get_summary():

    if analyzer is None:
        raise HTTPException(
            status_code=500,
            detail="Vehicle movement analyzer is not initialized."
        )

    try:
        return analyzer.get_traffic_summary()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate traffic summary: {str(e)}"
        )


# ============================================================
# Vehicle Trajectory
# ============================================================

@app.get("/api/vehicle/{vehicle_id}/trajectory")
def get_vehicle_trajectory(vehicle_id: str):

    if analyzer is None:
        raise HTTPException(
            status_code=500,
            detail="Vehicle movement analyzer is not initialized."
        )

    try:
        trajectory_data = analyzer.get_vehicle_trajectory(vehicle_id)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve vehicle trajectory: {str(e)}"
        )

    if not trajectory_data:
        raise HTTPException(
            status_code=404,
            detail=f"Vehicle ID '{vehicle_id}' not found."
        )

    return trajectory_data


# ============================================================
# Speed Violations
# ============================================================

@app.get("/api/violations")
def get_speed_violations(
    speed_limit: float = Query(
        50.0,
        description="Speed threshold limit in km/h"
    )
):

    if analyzer is None:
        raise HTTPException(
            status_code=500,
            detail="Vehicle movement analyzer is not initialized."
        )

    if speed_limit <= 0:
        raise HTTPException(
            status_code=400,
            detail="Speed limit must be greater than 0."
        )

    try:
        violations = analyzer.detect_speed_violations(
            speed_limit_default=speed_limit
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to detect speed violations: {str(e)}"
        )

    return {
        "speed_limit_threshold": speed_limit,
        "total_violations": len(violations),
        "violations": violations
    }


# ============================================================
# OCR Vehicle Movement Analysis
# ============================================================

@app.get("/api/analyze/{identifier}")
def analyze_vehicle(identifier: str):

    if MERGED_DATA is None:
        raise HTTPException(
            status_code=500,
            detail="OCR movement data pipeline is not initialized."
        )

    try:
        result = analyze_ocr_movement(
            MERGED_DATA,
            identifier,
            dwell_threshold_mins=8.0
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze vehicle movement: {str(e)}"
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Vehicle '{identifier}' not found in detections."
        )

    return result
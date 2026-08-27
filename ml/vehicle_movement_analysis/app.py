import sys
import os

# Add the current directory to Python's path
# so local modules such as analytics can be imported.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from analytics.movement_analyzer import VehicleMovementAnalyzer


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="Nagar-Drishti Vehicle Movement Analysis API",
    description=(
        "FastAPI service for urban vehicle trajectory tracking, "
        "traffic analysis, and speed violation detection."
    ),
    version="1.0.0"
)


# ============================================================
# CORS Configuration
# ============================================================

# Allows the frontend to communicate with this FastAPI backend.
# This is suitable for development.
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
    """
    Basic health check endpoint.
    """

    return {
        "status": "healthy" if analyzer is not None else "degraded",
        "analyzer_initialized": analyzer is not None
    }


# ============================================================
# Traffic Summary
# ============================================================

@app.get("/api/summary")
def get_summary():
    """
    Retrieve high-level traffic metrics.
    """

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
    """
    Fetch the chronological tracking and speed profile
    for a specific vehicle.
    """

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
    """
    Identify speeding violations across camera checkpoints.
    """

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
import sys
import os

# 1. Append directory to path FIRST so Python can find local modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 2. Now perform your imports safely
from fastapi import FastAPI, HTTPException, Query
from analytics.movement_analyzer import VehicleMovementAnalyzer

app = FastAPI(
    title="Vehicle Movement Analysis API",
    description="FastAPI integration wrapper for urban vehicle trajectory tracking and speed monitoring models.",
    version="1.0.0"
)

# Initialize the analyzer model pointing to local data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
analyzer = VehicleMovementAnalyzer(
    detections_path=os.path.join(DATA_DIR, "detections.csv"),
    cameras_path=os.path.join(DATA_DIR, "cameras.csv"),
    roads_path=os.path.join(DATA_DIR, "roads.csv"),
    zones_path=os.path.join(DATA_DIR, "zones.csv")
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Vehicle Movement Analysis Engine API"}

@app.get("/api/summary")
def get_summary():
    """Endpoint to retrieve high-level traffic metrics."""
    return analyzer.get_traffic_summary()

@app.get("/api/vehicle/{vehicle_id}/trajectory")
def get_vehicle_trajectory(vehicle_id: str):
    """Endpoint to fetch the chronological tracking and speed profile for a specific vehicle."""
    trajectory_data = analyzer.get_vehicle_trajectory(vehicle_id)
    if not trajectory_data:
        raise HTTPException(status_code=404, detail=f"Vehicle ID '{vehicle_id}' not found.")
    return trajectory_data

@app.get("/api/violations")
def get_speed_violations(speed_limit: float = Query(50.0, description="Speed threshold limit in km/h")):
    """Endpoint to identify speeding violations across camera checkpoints."""
    violations = analyzer.detect_speed_violations(speed_limit_default=speed_limit)
    return {
        "speed_limit_threshold": speed_limit,
        "total_violations": len(violations),
        "violations": violations
    }
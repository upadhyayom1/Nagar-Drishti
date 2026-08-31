from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import traceback
import pandas as pd
import os

from analytics.movement_analyzer import VehicleMovementAnalyzer, analyze_ocr_movement
from analytics.interceptor import VehicleInterceptor

app = FastAPI(title="Nagar-Drishti Movement & Interceptor API", version="2.1")


class TransitionInput(BaseModel):
    sourceCameraId: str
    destinationCameraId: str
    destinationCameraCode: str
    destinationCameraName: str
    destinationZone: str | None = None
    destinationRoad: str | None = None
    travelTimeSeconds: float | None = None
    vehicleId: str | None = None


class NextCameraRequest(BaseModel):
    vehicleId: str
    lastCameraId: str
    transitions: list[TransitionInput] = Field(default_factory=list)
    vehicleTransitions: list[TransitionInput] = Field(default_factory=list)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

DETECTIONS_PATH = os.path.join(DATA_DIR, "detections.csv")
CAMERAS_PATH = os.path.join(DATA_DIR, "cameras.csv")
ROADS_PATH = os.path.join(DATA_DIR, "roads.csv")
ZONES_PATH = os.path.join(DATA_DIR, "zones.csv")
BLACKLIST_PATH = os.path.join(DATA_DIR, "blacklisted_vehicles_checkpoints.json")

analyzer_engine = None
interceptor_engine = None
raw_detections = None
raw_cameras = None
_data_mtimes = {}

def reload_ml_data_if_changed():
    global analyzer_engine, interceptor_engine, raw_detections, raw_cameras, _data_mtimes
    det_mtime = os.path.getmtime(DETECTIONS_PATH) if os.path.exists(DETECTIONS_PATH) else None
    cam_mtime = os.path.getmtime(CAMERAS_PATH) if os.path.exists(CAMERAS_PATH) else None

    if _data_mtimes.get("detections") == det_mtime and _data_mtimes.get("cameras") == cam_mtime and analyzer_engine is not None:
        return

    raw_detections = pd.read_csv(DETECTIONS_PATH, low_memory=False) if det_mtime else None
    raw_cameras = pd.read_csv(CAMERAS_PATH, low_memory=False) if cam_mtime else None
    analyzer_engine = VehicleMovementAnalyzer(DETECTIONS_PATH, CAMERAS_PATH, ROADS_PATH, ZONES_PATH)
    interceptor_engine = VehicleInterceptor(raw_detections, raw_cameras, BLACKLIST_PATH)
    _data_mtimes = {"detections": det_mtime, "cameras": cam_mtime}
    print("ML dataset loaded/refreshed.")


@app.on_event("startup")
def startup_event():
    try:
        reload_ml_data_if_changed()
        print("Successfully loaded Nagar-Drishti ML analysis modules.")
    except Exception as e:
        print(f"Startup Warning: {e}")


@app.get("/health")
def health():
    return {"status": "ok", "service": "vehicle-movement-analysis", "modelLoaded": interceptor_engine is not None}


@app.post("/api/blacklisted/predict-next")
def predict_live_next_camera(request: NextCameraRequest):
    scores = {}

    def add_transition(transition: TransitionInput, weight: int):
        if transition.sourceCameraId != request.lastCameraId:
            return
        current = scores.setdefault(transition.destinationCameraId, {"transition": transition, "score": 0, "travel_times": []})
        current["score"] += weight
        if transition.travelTimeSeconds and transition.travelTimeSeconds > 0:
            current["travel_times"].append(transition.travelTimeSeconds)

    for transition in request.transitions:
        add_transition(transition, 1)
    for transition in request.vehicleTransitions:
        add_transition(transition, 3)

    if not scores:
        return {"vehicleId": request.vehicleId, "prediction": None, "alternatives": []}

    ranked = sorted(scores.values(), key=lambda candidate: candidate["score"], reverse=True)
    total_score = sum(candidate["score"] for candidate in ranked)

    def serialize(candidate):
        transition = candidate["transition"]
        average_seconds = sum(candidate["travel_times"]) / len(candidate["travel_times"]) if candidate["travel_times"] else None
        confidence = "HIGH" if candidate["score"] >= 12 else "MODERATE" if candidate["score"] >= 4 else "LOW"
        return {
            "cameraId": transition.destinationCameraId,
            "cameraCode": transition.destinationCameraCode,
            "cameraName": transition.destinationCameraName,
            "zone": transition.destinationZone,
            "road": transition.destinationRoad,
            "probability": candidate["score"] / total_score,
            "etaMinutes": max(1, round(average_seconds / 60)) if average_seconds else None,
            "confidence": confidence,
            "basis": "VEHICLE_AND_NETWORK_TRANSITIONS" if request.vehicleTransitions else "NETWORK_TRANSITIONS",
        }

    return {"vehicleId": request.vehicleId, "prediction": serialize(ranked[0]), "alternatives": [serialize(candidate) for candidate in ranked[1:4]]}

@app.get("/api/vehicle/{vehicle_id}/trajectory")
def get_trajectory(vehicle_id: str):
    try:
        if not analyzer_engine:
            raise HTTPException(status_code=500, detail="Analyzer engine not initialized.")
        res = analyzer_engine.get_vehicle_trajectory(vehicle_id)
        if not res:
            raise HTTPException(status_code=404, detail=f"Vehicle ID '{vehicle_id}' not found.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vehicle/{vehicle_id}/ocr-analysis")
def get_ocr_analysis(vehicle_id: str):
    try:
        reload_ml_data_if_changed()
        if raw_detections is None:
            raise HTTPException(status_code=500, detail="Detections data not loaded.")
        res = analyze_ocr_movement(raw_detections, vehicle_id)
        if not res:
            raise HTTPException(status_code=404, detail=f"Vehicle ID '{vehicle_id}' not found in detections.")
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blacklisted/predict-next/{vehicle_id}")
def predict_blacklisted_next(vehicle_id: str):
    try:
        reload_ml_data_if_changed()
        if not interceptor_engine:
            raise HTTPException(status_code=500, detail="Interceptor engine not initialized.")
        res = interceptor_engine.predict_next_for_vehicle(vehicle_id)
        if "error" in res:
            raise HTTPException(status_code=404, detail=res["error"])
        return res
    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# forecast

from fastapi import FastAPI, Query, HTTPException
from forecasting.predictor import TrafficCongestionPredictor

congestion_predictor = TrafficCongestionPredictor()

@app.get("/api/forecast/congestion")
def get_traffic_congestion_forecast(
    minutes: int = Query(30, description="Arbitrary future time horizon in minutes (e.g., 15, 30, 60, 75)"),
    threshold: int = Query(15, description="Vehicle volume threshold to flag a bottleneck")
):
    """
    Predicts traffic bottlenecks and vehicle flow densities for any custom 
    time window ahead, isolated safely from base tracking pipelines.
    """
    try:
        forecast_result = congestion_predictor.predict_congestion(
            horizon_mins=minutes, 
            capacity_threshold=threshold
        )
        return forecast_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting calculation failed: {str(e)}")
from fastapi import FastAPI, HTTPException
import traceback
import pandas as pd
import os

from analytics.movement_analyzer import VehicleMovementAnalyzer, analyze_ocr_movement
from analytics.interceptor import VehicleInterceptor

app = FastAPI(title="Nagar-Drishti Movement & Interceptor API", version="2.1")

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

@app.on_event("startup")
def startup_event():
    global analyzer_engine, interceptor_engine, raw_detections, raw_cameras
    try:
        if os.path.exists(DETECTIONS_PATH):
            raw_detections = pd.read_csv(DETECTIONS_PATH, low_memory=False)
        if os.path.exists(CAMERAS_PATH):
            raw_cameras = pd.read_csv(CAMERAS_PATH, low_memory=False)

        analyzer_engine = VehicleMovementAnalyzer(DETECTIONS_PATH, CAMERAS_PATH, ROADS_PATH, ZONES_PATH)
        interceptor_engine = VehicleInterceptor(raw_detections, raw_cameras, BLACKLIST_PATH)
        print("Successfully loaded Nagar-Drishti ML analysis modules.")
    except Exception as e:
        print(f"Startup Warning: {e}")

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
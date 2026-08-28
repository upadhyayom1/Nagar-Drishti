import pandas as pd
import numpy as np
from datetime import datetime
from math import radians, sin, cos, sqrt, asin
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN

def haversine_km(lat1, lon1, lat2, lon2):
    try:
        r = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
        return 2 * r * asin(sqrt(a))
    except Exception:
        return 0.0

def analyze_ocr_movement(df_all: pd.DataFrame, vehicle_identifier: str, dwell_threshold_mins: float = 8.0):
    if df_all is None or df_all.empty:
        return None

    clean_query = str(vehicle_identifier).replace(" ", "").replace("-", "").strip().upper()
    
    # Identify key columns dynamically
    v_id_col = next((c for c in ["vehicleId", "vehicle_id", "id"] if c in df_all.columns), None)
    p_col = next((c for c in ["plateText", "plateNumber", "plate"] if c in df_all.columns), None)

    if not v_id_col and not p_col:
        return None

    # Filter safely
    mask = pd.Series(False, index=df_all.index)
    if v_id_col:
        mask = mask | (df_all[v_id_col].astype(str).str.replace(" ", "", regex=False).str.upper() == clean_query)
    if p_col:
        mask = mask | (df_all[p_col].astype(str).str.replace(" ", "", regex=False).str.upper() == clean_query)

    df = df_all[mask].copy()
    if df.empty:
        return None

    # Timestamp standardization
    time_col = next((c for c in ["timestamp", "time", "createdAt"] if c in df.columns), None)
    if not time_col:
        return None

    df["timestamp"] = pd.to_datetime(df[time_col], errors="coerce")
    df = df.dropna(subset=["timestamp"]).sort_values("timestamp").reset_index(drop=True)
    if df.empty:
        return None

    df["prev_lat"] = df["latitude"].shift(1)
    df["prev_lon"] = df["longitude"].shift(1)
    df["prev_time"] = df["timestamp"].shift(1)

    df["distance_km"] = [
        haversine_km(row.prev_lat, row.prev_lon, row.latitude, row.longitude) if pd.notnull(row.prev_lat) else 0.0
        for row in df.itertuples()
    ]

    df["time_diff_sec"] = (df["timestamp"] - df["prev_time"]).dt.total_seconds().fillna(0)
    df["time_diff_mins"] = df["time_diff_sec"] / 60.0
    df["time_diff_hrs"] = df["time_diff_mins"] / 60.0

    df["is_dwell_stop"] = (df["time_diff_mins"] > dwell_threshold_mins) & (df["distance_km"] < 0.1)
    valid_movement = (df["time_diff_sec"] >= 10.0) & (df["distance_km"] >= 0.05) & (~df["is_dwell_stop"])

    df["raw_speed_kmh"] = np.where(valid_movement, df["distance_km"] / df["time_diff_hrs"], np.nan)
    df["derived_speed_kmh"] = df["raw_speed_kmh"].clip(lower=0.0, upper=120.0).fillna(0.0)

    # ML Isolation Forest
    anomalies_count = 0
    if len(df) > 2:
        try:
            features = df[["derived_speed_kmh", "time_diff_mins"]].fillna(0)
            iso = IsolationForest(contamination=min(0.08, 1.0 / len(df)), random_state=42)
            df["is_anomaly"] = iso.fit_predict(features) == -1
            anomalies_count = int(df["is_anomaly"].sum())
        except Exception:
            df["is_anomaly"] = False
    else:
        df["is_anomaly"] = False

    # Hotspot DBSCAN clustering
    hotspot_count = 0
    if len(df) >= 3:
        try:
            coords_rad = np.radians(df[["latitude", "longitude"]])
            db = DBSCAN(eps=0.5 / 6371.0, min_samples=min(3, len(df)), metric="haversine")
            clusters = db.fit_predict(coords_rad)
            hotspot_count = len(set(clusters) - {-1})
        except Exception:
            pass

    valid_speeds = df[df["derived_speed_kmh"] > 0]["derived_speed_kmh"]
    dwell_records = df[df["time_diff_mins"] > dwell_threshold_mins]
    
    v_type = str(df["vehicleType"].iloc[0]) if "vehicleType" in df.columns else "UNKNOWN"
    actual_v_id = str(df[v_id_col].iloc[0]) if v_id_col else vehicle_identifier
    actual_plate = str(df[p_col].iloc[0]) if p_col else vehicle_identifier

    summary = {
        "vehicle_id": actual_v_id,
        "plate": actual_plate,
        "vehicle_type": v_type,
        "total_detections": len(df),
        "avg_segment_speed_kmh": round(float(valid_speeds.mean()), 2) if not valid_speeds.empty else 0.0,
        "max_segment_speed_kmh": round(float(valid_speeds.max()), 2) if not valid_speeds.empty else 0.0,
        "total_dwell_hours": round(float(dwell_records["time_diff_mins"].sum() / 60.0), 2),
        "anomalous_events_detected": anomalies_count,
        "frequent_hotspots": hotspot_count,
        "dwell_threshold_used_mins": dwell_threshold_mins
    }

    cam_col = next((c for c in ["cameraCode", "cameraId", "camera_id"] if c in df.columns), "cameraId")
    recent_cols = ["timestamp", cam_col, "latitude", "longitude", "derived_speed_kmh"]
    recent_cols = [c for c in recent_cols if c in df.columns]
    
    recent_route = []
    for row in df.tail(10).itertuples():
        recent_route.append({
            "timestamp": str(getattr(row, "timestamp", "")),
            "camera_id": str(getattr(row, cam_col, "UNKNOWN")),
            "latitude": float(getattr(row, "latitude", 0.0)),
            "longitude": float(getattr(row, "longitude", 0.0)),
            "derived_speed_kmh": float(getattr(row, "derived_speed_kmh", 0.0))
        })

    return {"summary": summary, "recent_route": recent_route}


class VehicleMovementAnalyzer:
    def __init__(self, detections_path: str, cameras_path: str, roads_path: str, zones_path: str):
        self.detections_path = detections_path

    def get_vehicle_trajectory(self, vehicle_id: str):
        df_all = pd.read_csv(self.detections_path, low_memory=False)
        analysis = analyze_ocr_movement(df_all, vehicle_id)
        if not analysis:
            return None
        
        return {
            "vehicle_id": analysis["summary"]["vehicle_id"],
            "total_sightings": analysis["summary"]["total_detections"],
            "trajectory": analysis["recent_route"]
        }
import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN

def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    return 2 * r * asin(sqrt(a))

def analyze_ocr_movement(df_all: pd.DataFrame, vehicle_identifier: str, dwell_threshold_mins: float = 8.0):
    # Case & space insensitive matching
    clean_query = vehicle_identifier.replace(" ", "").replace("-", "").strip().upper()
    clean_vehicle_ids = df_all['vehicleId'].astype(str).str.replace(" ", "").str.replace("-", "").str.upper()
    clean_plates = df_all['plateText'].astype(str).str.replace(" ", "").str.replace("-", "").str.upper()

    df = df_all[(clean_vehicle_ids == clean_query) | (clean_plates == clean_query)].copy()
    
    if df.empty:
        return None

    # Sort & calculate deltas
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')

    df['prev_lat'] = df['latitude'].shift(1)
    df['prev_lon'] = df['longitude'].shift(1)
    df['prev_time'] = df['timestamp'].shift(1)

    # 1. Distance Calculation
    distances = [
        haversine_km(r.prev_lat, r.prev_lon, r.latitude, r.longitude) if pd.notnull(r.prev_lat) else 0.0
        for r in df.itertuples()
    ]
    df['distance_km'] = distances

    # 2. Time Deltas
    df['time_diff_sec'] = (df['timestamp'] - df['prev_time']).dt.total_seconds()
    df['time_diff_mins'] = df['time_diff_sec'] / 60.0
    df['time_diff_hrs'] = df['time_diff_mins'] / 60.0

    # 3. Dwell Stops
    df['is_dwell_stop'] = (df['time_diff_mins'] > dwell_threshold_mins) & (df['distance_km'] < 0.1)

    # 4. Speed Calculation & Clipping
    valid_movement = (df['time_diff_sec'] >= 10.0) & (df['distance_km'] >= 0.05) & (~df['is_dwell_stop'])
    df['raw_speed_kmh'] = np.where(valid_movement, df['distance_km'] / df['time_diff_hrs'], np.nan)
    df['derived_speed_kmh'] = df['raw_speed_kmh'].clip(lower=0.0, upper=120.0).fillna(0.0)

    # 5. Anomaly Detection (Adds 'is_anomaly' column BEFORE constructing summary)
    features = df[['derived_speed_kmh', 'time_diff_mins']].fillna(0)
    if len(df) > 1:
        iso = IsolationForest(contamination=0.08, random_state=42)
        df['is_anomaly'] = iso.fit_predict(features) == -1
    else:
        df['is_anomaly'] = False

    # 6. Hotspot Clustering via DBSCAN (~500m radius)
    coords_rad = np.radians(df[['latitude', 'longitude']])
    db = DBSCAN(eps=0.5 / 6371.0, min_samples=3, metric='haversine')
    df['hotspot_cluster'] = db.fit_predict(coords_rad)

    # Metrics Summary
    valid_speeds = df[df['derived_speed_kmh'] > 0]['derived_speed_kmh']
    dwell_records = df[df['time_diff_mins'] > dwell_threshold_mins]
    dwell_hours = dwell_records['time_diff_mins'].sum() / 60.0

    summary = {
        "vehicle_id": str(df['vehicleId'].iloc[0]),
        "plate": str(df['plateText'].iloc[0]),
        "vehicle_type": str(df['vehicleType'].iloc[0]) if 'vehicleType' in df.columns else "UNKNOWN",
        "total_detections": len(df),
        "avg_segment_speed_kmh": round(float(valid_speeds.mean()), 2) if not valid_speeds.empty else 0.0,
        "max_segment_speed_kmh": round(float(valid_speeds.max()), 2) if not valid_speeds.empty else 0.0,
        "total_dwell_hours": round(float(dwell_hours), 2),
        "anomalous_events_detected": int(df['is_anomaly'].sum()),
        "frequent_hotspots": len(set(df['hotspot_cluster'])) - (1 if -1 in df['hotspot_cluster'] else 0),
        "dwell_threshold_used_mins": dwell_threshold_mins
    }

    # Column name resolution for serialization
    cam_col = 'cameraCode' if 'cameraCode' in df.columns else ('cameraCode_x' if 'cameraCode_x' in df.columns else 'mapped_code')
    recent_route = df[['timestamp', 'cameraId', cam_col, 'latitude', 'longitude', 'derived_speed_kmh', 'ocrConfidence']].tail(10).to_dict(orient='records')

    for item in recent_route:
        item['timestamp'] = str(item['timestamp'])

    return {"summary": summary, "recent_route": recent_route}
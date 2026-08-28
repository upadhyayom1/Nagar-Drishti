import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def load_and_aggregate_detections(freq_minutes: int = 15) -> pd.DataFrame:
    det_path = os.path.join(DATA_DIR, "detections.csv")
    cam_path = os.path.join(DATA_DIR, "cameras.csv")
    zone_path = os.path.join(DATA_DIR, "zones.csv")

    if not os.path.exists(det_path) or not os.path.exists(cam_path):
        return pd.DataFrame(columns=["camera_id", "time_bin", "vehicle_count", "zone_id"])

    df_det = pd.read_csv(det_path, low_memory=False)
    df_cam = pd.read_csv(cam_path, low_memory=False)
    df_zones = pd.read_csv(zone_path, low_memory=False) if os.path.exists(zone_path) else pd.DataFrame()

    time_col = "timestamp" if "timestamp" in df_det.columns else "time"
    
    # Explicitly using cameraId since that is the column in detections.csv
    cam_id_col = "cameraId" if "cameraId" in df_det.columns else "cameraCode"

    df_det[time_col] = pd.to_datetime(df_det[time_col], errors="coerce")
    df_det = df_det.dropna(subset=[time_col, cam_id_col])
    df_det["time_bin"] = df_det[time_col].dt.floor(f"{freq_minutes}min")

    agg_df = df_det.groupby([cam_id_col, "time_bin"]).size().reset_index(name="vehicle_count")
    agg_df.rename(columns={cam_id_col: "camera_id"}, inplace=True)

    # In cameras.csv, the primary key is 'id' and zone reference is 'zoneId'
    cam_join_col = "id" if "id" in df_cam.columns else "cameraCode"

    if "zoneId" in df_cam.columns and not df_zones.empty and "id" in df_zones.columns:
        zone_display_col = "name" if "name" in df_zones.columns else "zoneCode"
        
        zones_subset = df_zones[["id", zone_display_col]].rename(columns={"id": "zoneId", zone_display_col: "zone_name"})
        cam_meta = pd.merge(df_cam, zones_subset, on="zoneId", how="left")
        
        cam_meta_mapping = cam_meta[[cam_join_col, "zone_name"]].rename(columns={cam_join_col: "camera_id", "zone_name": "zone_id"})
        
        agg_df["camera_id"] = agg_df["camera_id"].astype(str)
        cam_meta_mapping["camera_id"] = cam_meta_mapping["camera_id"].astype(str)
        
        agg_df = pd.merge(agg_df, cam_meta_mapping, on="camera_id", how="left")
    else:
        agg_df["zone_id"] = "Unassigned"

    agg_df["zone_id"] = agg_df["zone_id"].fillna("Unassigned")
    return agg_df

def build_supervised_features(target_horizon_mins: int = 30):
    freq = 15
    df = load_and_aggregate_detections(freq_minutes=freq)
    
    if df.empty:
        return pd.DataFrame()

    df = df.sort_values(["camera_id", "time_bin"])
    df["lag_1"] = df.groupby("camera_id")["vehicle_count"].shift(1)
    df["lag_2"] = df.groupby("camera_id")["vehicle_count"].shift(2)
    df["rolling_mean_4"] = df.groupby("camera_id")["vehicle_count"].rolling(4, min_periods=1).mean().reset_index(0, drop=True)

    steps_ahead = max(1, target_horizon_mins // freq)
    df["target_future_count"] = df.groupby("camera_id")["vehicle_count"].shift(-steps_ahead)
    
    df["horizon_parameter_mins"] = target_horizon_mins
    df["hour_of_day"] = df["time_bin"].dt.hour
    df["day_of_week"] = df["time_bin"].dt.dayofweek

    return df.dropna()
import os
import pandas as pd
import numpy as np

DATA_DIR = os.getenv(
    "ML_DATA_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"),
)


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
    cam_id_col = "cameraId" if "cameraId" in df_det.columns else "cameraCode"
    if time_col not in df_det.columns or cam_id_col not in df_det.columns:
        return pd.DataFrame(columns=["camera_id", "time_bin", "vehicle_count", "zone_id"])

    df_det[time_col] = pd.to_datetime(df_det[time_col], errors="coerce", utc=True)
    df_det = df_det.dropna(subset=[time_col, cam_id_col]).copy()
    if df_det.empty:
        return pd.DataFrame(columns=["camera_id", "time_bin", "vehicle_count", "zone_id"])

    df_det["camera_id"] = df_det[cam_id_col].astype(str)
    df_det["time_bin"] = df_det[time_col].dt.floor(f"{freq_minutes}min")

    # Count distinct vehicles per camera/time bucket. Repeated frames of one vehicle
    # must not inflate traffic volume.
    if "vehicleId" in df_det.columns:
        grouped = (
            df_det.groupby(["camera_id", "time_bin"])["vehicleId"]
            .nunique()
            .reset_index(name="vehicle_count")
        )
    else:
        grouped = df_det.groupby(["camera_id", "time_bin"]).size().reset_index(name="vehicle_count")

    # Fill missing time buckets with zero for every camera represented in the data.
    cameras = sorted(grouped["camera_id"].unique())
    start = grouped["time_bin"].min()
    end = grouped["time_bin"].max()
    timeline = pd.date_range(start=start, end=end, freq=f"{freq_minutes}min", tz="UTC")
    full_index = pd.MultiIndex.from_product([cameras, timeline], names=["camera_id", "time_bin"])
    agg_df = (
        grouped.set_index(["camera_id", "time_bin"])
        .reindex(full_index, fill_value=0)
        .reset_index()
    )
    agg_df["vehicle_count"] = agg_df["vehicle_count"].astype(float)

    cam_join_col = "id" if "id" in df_cam.columns else "cameraCode"
    if cam_join_col in df_cam.columns:
        cam_meta = df_cam[[cam_join_col] + ([ "zoneId" ] if "zoneId" in df_cam.columns else [])].copy()
        cam_meta[cam_join_col] = cam_meta[cam_join_col].astype(str)
        if "zoneId" in cam_meta.columns and not df_zones.empty and "id" in df_zones.columns:
            zone_display_col = "name" if "name" in df_zones.columns else "zoneCode"
            zones_subset = df_zones[["id", zone_display_col]].rename(
                columns={"id": "zoneId", zone_display_col: "zone_id"}
            )
            cam_meta = cam_meta.merge(zones_subset, on="zoneId", how="left")
        else:
            cam_meta["zone_id"] = "Unassigned"

        cam_meta_mapping = cam_meta[[cam_join_col, "zone_id"]].rename(
            columns={cam_join_col: "camera_id"}
        )
        agg_df = agg_df.merge(cam_meta_mapping, on="camera_id", how="left")
    else:
        agg_df["zone_id"] = "Unassigned"

    agg_df["zone_id"] = agg_df["zone_id"].fillna("Unassigned")
    return agg_df


def build_supervised_features(target_horizon_mins: int = 30):
    freq = 15
    df = load_and_aggregate_detections(freq_minutes=freq)
    if df.empty:
        return pd.DataFrame()

    df = df.sort_values(["camera_id", "time_bin"]).copy()
    grouped = df.groupby("camera_id", group_keys=False)
    df["lag_1"] = grouped["vehicle_count"].shift(1)
    df["lag_2"] = grouped["vehicle_count"].shift(2)
    df["rolling_mean_4"] = grouped["vehicle_count"].transform(
        lambda series: series.rolling(4, min_periods=4).mean()
    )

    steps_ahead = max(1, int(np.ceil(target_horizon_mins / freq)))
    df["target_future_count"] = grouped["vehicle_count"].shift(-steps_ahead)
    
    df["target_ratio"] = (df["target_future_count"] + 1) / (df["vehicle_count"] + 1)
    df["lag_1_ratio"] = (df["lag_1"] + 1) / (df["vehicle_count"] + 1)
    df["lag_2_ratio"] = (df["lag_2"] + 1) / (df["vehicle_count"] + 1)
    df["rolling_mean_4_ratio"] = (df["rolling_mean_4"] + 1) / (df["vehicle_count"] + 1)

    df["target_time"] = df["time_bin"] + pd.to_timedelta(target_horizon_mins, unit="m")
    df["horizon_parameter_mins"] = target_horizon_mins
    df["hour_of_day"] = df["time_bin"].dt.hour
    df["day_of_week"] = df["time_bin"].dt.dayofweek

    return df.dropna(
        subset=["vehicle_count", "lag_1_ratio", "lag_2_ratio", "rolling_mean_4_ratio", "target_ratio"]
    ).reset_index(drop=True)

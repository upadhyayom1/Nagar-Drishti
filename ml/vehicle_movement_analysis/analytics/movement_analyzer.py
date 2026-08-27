import pandas as pd
import numpy as np

from datetime import datetime
from math import radians, sin, cos, sqrt, asin, atan2

from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN


# ============================================================
# Shared Haversine Distance Utility
# ============================================================

def haversine_km(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two coordinates
    in kilometers.
    """
    r = 6371.0

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    return 2 * r * asin(sqrt(a))


# ============================================================
# OCR Vehicle Movement Analysis
# ============================================================

def analyze_ocr_movement(
    df_all: pd.DataFrame,
    vehicle_identifier: str,
    dwell_threshold_mins: float = 8.0
):
    """
    Analyze movement of a vehicle using OCR detection data.

    Supports searching by:
    - vehicleId
    - plateText

    Performs:
    - Distance calculation
    - Time delta calculation
    - Dwell detection
    - Speed calculation
    - Speed clipping
    - Isolation Forest anomaly detection
    - DBSCAN hotspot clustering
    """

    # --------------------------------------------------------
    # Normalize search input
    # --------------------------------------------------------

    clean_query = (
        vehicle_identifier
        .replace(" ", "")
        .replace("-", "")
        .strip()
        .upper()
    )

    clean_vehicle_ids = (
        df_all["vehicleId"]
        .astype(str)
        .str.replace(" ", "", regex=False)
        .str.replace("-", "", regex=False)
        .str.upper()
    )

    clean_plates = (
        df_all["plateText"]
        .astype(str)
        .str.replace(" ", "", regex=False)
        .str.replace("-", "", regex=False)
        .str.upper()
    )

    # --------------------------------------------------------
    # Find requested vehicle
    # --------------------------------------------------------

    df = df_all[
        (clean_vehicle_ids == clean_query)
        | (clean_plates == clean_query)
    ].copy()

    if df.empty:
        return None

    # --------------------------------------------------------
    # Sort by timestamp
    # --------------------------------------------------------

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # --------------------------------------------------------
    # Previous detection information
    # --------------------------------------------------------

    df["prev_lat"] = df["latitude"].shift(1)
    df["prev_lon"] = df["longitude"].shift(1)
    df["prev_time"] = df["timestamp"].shift(1)

    # --------------------------------------------------------
    # 1. Distance Calculation
    # --------------------------------------------------------

    distances = [
        (
            haversine_km(
                row.prev_lat,
                row.prev_lon,
                row.latitude,
                row.longitude
            )
            if pd.notnull(row.prev_lat)
            else 0.0
        )
        for row in df.itertuples()
    ]

    df["distance_km"] = distances

    # --------------------------------------------------------
    # 2. Time Delta Calculation
    # --------------------------------------------------------

    df["time_diff_sec"] = (
        df["timestamp"] - df["prev_time"]
    ).dt.total_seconds()

    df["time_diff_mins"] = df["time_diff_sec"] / 60.0
    df["time_diff_hrs"] = df["time_diff_mins"] / 60.0

    # --------------------------------------------------------
    # 3. Dwell Stop Detection
    # --------------------------------------------------------

    df["is_dwell_stop"] = (
        (df["time_diff_mins"] > dwell_threshold_mins)
        & (df["distance_km"] < 0.1)
    )

    # --------------------------------------------------------
    # 4. Speed Calculation
    # --------------------------------------------------------

    valid_movement = (
        (df["time_diff_sec"] >= 10.0)
        & (df["distance_km"] >= 0.05)
        & (~df["is_dwell_stop"])
    )

    df["raw_speed_kmh"] = np.where(
        valid_movement,
        df["distance_km"] / df["time_diff_hrs"],
        np.nan
    )

    # Prevent unrealistic calculated speeds
    df["derived_speed_kmh"] = (
        df["raw_speed_kmh"]
        .clip(lower=0.0, upper=120.0)
        .fillna(0.0)
    )

    # --------------------------------------------------------
    # 5. Anomaly Detection
    # --------------------------------------------------------

    features = df[
        ["derived_speed_kmh", "time_diff_mins"]
    ].fillna(0)

    if len(df) > 1:
        iso = IsolationForest(
            contamination=0.08,
            random_state=42
        )

        df["is_anomaly"] = (
            iso.fit_predict(features) == -1
        )
    else:
        df["is_anomaly"] = False

    # --------------------------------------------------------
    # 6. Hotspot Clustering
    # --------------------------------------------------------
    # DBSCAN using haversine distance.
    # eps = 0.5 km / Earth's radius ≈ 500 meters.

    coords_rad = np.radians(
        df[["latitude", "longitude"]]
    )

    db = DBSCAN(
        eps=0.5 / 6371.0,
        min_samples=3,
        metric="haversine"
    )

    df["hotspot_cluster"] = db.fit_predict(coords_rad)

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    valid_speeds = df[
        df["derived_speed_kmh"] > 0
    ]["derived_speed_kmh"]

    dwell_records = df[
        df["time_diff_mins"] > dwell_threshold_mins
    ]

    dwell_hours = (
        dwell_records["time_diff_mins"].sum() / 60.0
    )

    hotspot_clusters = set(
        df["hotspot_cluster"]
    )

    # -1 represents DBSCAN noise
    if -1 in hotspot_clusters:
        hotspot_clusters.remove(-1)

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    summary = {
        "vehicle_id": str(
            df["vehicleId"].iloc[0]
        ),

        "plate": str(
            df["plateText"].iloc[0]
        ),

        "vehicle_type": (
            str(df["vehicleType"].iloc[0])
            if "vehicleType" in df.columns
            else "UNKNOWN"
        ),

        "total_detections": len(df),

        "avg_segment_speed_kmh": (
            round(float(valid_speeds.mean()), 2)
            if not valid_speeds.empty
            else 0.0
        ),

        "max_segment_speed_kmh": (
            round(float(valid_speeds.max()), 2)
            if not valid_speeds.empty
            else 0.0
        ),

        "total_dwell_hours": round(
            float(dwell_hours),
            2
        ),

        "anomalous_events_detected": int(
            df["is_anomaly"].sum()
        ),

        "frequent_hotspots": len(
            hotspot_clusters
        ),

        "dwell_threshold_used_mins": (
            dwell_threshold_mins
        )
    }

    # --------------------------------------------------------
    # Recent Route
    # --------------------------------------------------------

    if "cameraCode" in df.columns:
        cam_col = "cameraCode"
    elif "cameraCode_x" in df.columns:
        cam_col = "cameraCode_x"
    else:
        cam_col = "mapped_code"

    recent_columns = [
        "timestamp",
        "cameraId",
        cam_col,
        "latitude",
        "longitude",
        "derived_speed_kmh",
        "ocrConfidence"
    ]

    # Only use columns that actually exist
    recent_columns = [
        col for col in recent_columns
        if col in df.columns
    ]

    recent_route = (
        df[recent_columns]
        .tail(10)
        .to_dict(orient="records")
    )

    for item in recent_route:
        if "timestamp" in item:
            item["timestamp"] = str(
                item["timestamp"]
            )

    return {
        "summary": summary,
        "recent_route": recent_route
    }


# ============================================================
# Vehicle Movement Analyzer
# ============================================================

class VehicleMovementAnalyzer:
    """
    Main vehicle movement analysis engine.

    Loads detections, cameras, roads and zones and provides
    trajectory, traffic summary and speed violation analysis.
    """

    def __init__(
        self,
        detections_path: str,
        cameras_path: str,
        roads_path: str,
        zones_path: str
    ):
        """
        Initialize the analyzer by loading all datasets.
        """

        self.detections_df = pd.read_csv(
            detections_path
        )

        self.cameras_df = pd.read_csv(
            cameras_path
        )

        self.roads_df = pd.read_csv(
            roads_path
        )

        self.zones_df = pd.read_csv(
            zones_path
        )

        # Preprocess timestamps
        self.detections_df["timestamp"] = (
            pd.to_datetime(
                self.detections_df["timestamp"]
            )
        )

    # --------------------------------------------------------
    # Vehicle Trajectory
    # --------------------------------------------------------

    def get_vehicle_trajectory(
        self,
        vehicle_id: str
    ):
        """
        Reconstruct the chronological trajectory
        for a specific vehicle.
        """

        v_data = self.detections_df[
            self.detections_df["vehicleId"] == vehicle_id
        ].sort_values("timestamp")

        if v_data.empty:
            return None

        trajectory = []
        prev_row = None

        for _, row in v_data.iterrows():

            point_info = {
                "timestamp": row[
                    "timestamp"
                ].isoformat(),

                "camera_id": row[
                    "cameraId"
                ],

                "latitude": row[
                    "latitude"
                ],

                "longitude": row[
                    "longitude"
                ],

                "plate": row[
                    "plateText"
                ]
            }

            if prev_row is not None:

                dist_km = haversine_km(
                    prev_row["latitude"],
                    prev_row["longitude"],
                    row["latitude"],
                    row["longitude"]
                )

                time_diff_hrs = (
                    row["timestamp"]
                    - prev_row["timestamp"]
                ).total_seconds() / 3600.0

                speed_kmh = (
                    dist_km / time_diff_hrs
                    if time_diff_hrs > 0
                    else 0.0
                )

                point_info[
                    "distance_from_prev_km"
                ] = round(dist_km, 3)

                point_info[
                    "calculated_speed_kmh"
                ] = round(speed_kmh, 2)

            else:

                point_info[
                    "distance_from_prev_km"
                ] = 0.0

                point_info[
                    "calculated_speed_kmh"
                ] = 0.0

            trajectory.append(point_info)
            prev_row = row

        return {
            "vehicle_id": vehicle_id,
            "total_sightings": len(
                trajectory
            ),
            "trajectory": trajectory
        }

    # --------------------------------------------------------
    # Speed Violations
    # --------------------------------------------------------

    def detect_speed_violations(
        self,
        speed_limit_default: float = 50.0
    ):
        """
        Identify instances where vehicles exceed
        the configured speed threshold.
        """

        df = self.detections_df.copy()

        df = df.sort_values(
            ["vehicleId", "timestamp"]
        )

        df["prev_lat"] = (
            df.groupby("vehicleId")[
                "latitude"
            ].shift(1)
        )

        df["prev_lon"] = (
            df.groupby("vehicleId")[
                "longitude"
            ].shift(1)
        )

        df["prev_time"] = (
            df.groupby("vehicleId")[
                "timestamp"
            ].shift(1)
        )

        df["prev_cam"] = (
            df.groupby("vehicleId")[
                "cameraId"
            ].shift(1)
        )

        valid_segments = df.dropna(
            subset=["prev_lat"]
        ).copy()

        violations = []

        for _, row in valid_segments.iterrows():

            dist = haversine_km(
                row["prev_lat"],
                row["prev_lon"],
                row["latitude"],
                row["longitude"]
            )

            hours = (
                row["timestamp"]
                - row["prev_time"]
            ).total_seconds() / 3600.0

            if hours > 0:

                speed = dist / hours

                if speed > speed_limit_default:

                    violations.append({
                        "vehicle_id": row[
                            "vehicleId"
                        ],

                        "plate": row[
                            "plateText"
                        ],

                        "from_camera": row[
                            "prev_cam"
                        ],

                        "to_camera": row[
                            "cameraId"
                        ],

                        "speed_kmh": round(
                            speed,
                            2
                        ),

                        "speed_limit": (
                            speed_limit_default
                        ),

                        "timestamp": row[
                            "timestamp"
                        ].isoformat()
                    })

        return violations

    # --------------------------------------------------------
    # Traffic Summary
    # --------------------------------------------------------

    def get_traffic_summary(self):
        """
        Return high-level traffic metrics.
        """

        summary = {
            "total_detections": len(
                self.detections_df
            ),

            "unique_vehicles": (
                self.detections_df[
                    "vehicleId"
                ].nunique()
            ),

            "active_cameras": (
                self.cameras_df[
                    self.cameras_df[
                        "status"
                    ] == "ONLINE"
                ].shape[0]
            ),

            "busiest_cameras": (
                self.detections_df[
                    "cameraId"
                ]
                .value_counts()
                .head(5)
                .to_dict()
            )
        }

        return summary
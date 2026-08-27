import pandas as pd
import numpy as np
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

class VehicleMovementAnalyzer:
    def __init__(self, detections_path: str, cameras_path: str, roads_path: str, zones_path: str):
        """Initializes the analyzer by loading dataset references and mapping exact schema columns."""
        self.detections_df = pd.read_csv(detections_path)
        self.cameras_df = pd.read_csv(cameras_path)
        self.roads_df = pd.read_csv(roads_path)
        self.zones_df = pd.read_csv(zones_path)
        
        # Preprocessing timestamps
        self.detections_df['timestamp'] = pd.to_datetime(self.detections_df['timestamp'])

    def _haversine(self, lat1, lon1, lat2, lon2):
        """Calculates great-circle distance between two points in kilometers."""
        R = 6371.0
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c

    def get_vehicle_trajectory(self, vehicle_id: str):
        """Reconstructs chronologically ordered trajectory for a specific vehicle using exact schema keys."""
        # Using exact column names: 'vehicleId', 'cameraId', 'plateText'
        v_data = self.detections_df[self.detections_df['vehicleId'] == vehicle_id].sort_values('timestamp')
        if v_data.empty:
            return None
        
        trajectory = []
        prev_row = None
        
        for _, row in v_data.iterrows():
            point_info = {
                "timestamp": row['timestamp'].isoformat(),
                "camera_id": row['cameraId'],
                "latitude": row['latitude'],
                "longitude": row['longitude'],
                "plate": row['plateText']
            }
            
            if prev_row is not None:
                dist_km = self._haversine(prev_row['latitude'], prev_row['longitude'], row['latitude'], row['longitude'])
                time_diff_hrs = (row['timestamp'] - prev_row['timestamp']).total_seconds() / 3600.0
                speed_kmh = (dist_km / time_diff_hrs) if time_diff_hrs > 0 else 0.0
                point_info["distance_from_prev_km"] = round(dist_km, 3)
                point_info["calculated_speed_kmh"] = round(speed_kmh, 2)
            else:
                point_info["distance_from_prev_km"] = 0.0
                point_info["calculated_speed_kmh"] = 0.0
                
            trajectory.append(point_info)
            prev_row = row
            
        return {
            "vehicle_id": vehicle_id,
            "total_sightings": len(trajectory),
            "trajectory": trajectory
        }

    def detect_speed_violations(self, speed_limit_default: float = 50.0):
        """Identifies instances where a vehicle exceeds speed thresholds between camera checkpoints."""
        df = self.detections_df.sort_values(['vehicleId', 'timestamp'])
        df['prev_lat'] = df.groupby('vehicleId')['latitude'].shift(1)
        df['prev_lon'] = df.groupby('vehicleId')['longitude'].shift(1)
        df['prev_time'] = df.groupby('vehicleId')['timestamp'].shift(1)
        df['prev_cam'] = df.groupby('vehicleId')['cameraId'].shift(1)

        valid_segments = df.dropna(subset=['prev_lat']).copy()
        
        violations = []
        for _, row in valid_segments.iterrows():
            dist = self._haversine(row['prev_lat'], row['prev_lon'], row['latitude'], row['longitude'])
            hours = (row['timestamp'] - row['prev_time']).total_seconds() / 3600.0
            if hours > 0:
                speed = dist / hours
                if speed > speed_limit_default:
                    violations.append({
                        "vehicle_id": row['vehicleId'],
                        "plate": row['plateText'],
                        "from_camera": row['prev_cam'],
                        "to_camera": row['cameraId'],
                        "speed_kmh": round(speed, 2),
                        "speed_limit": speed_limit_default,
                        "timestamp": row['timestamp'].isoformat()
                    })
        return violations

    def get_traffic_summary(self):
        """Returns overall high-level metrics on camera activity and detection density."""
        summary = {
            "total_detections": len(self.detections_df),
            "unique_vehicles": self.detections_df['vehicleId'].nunique(),
            # Using 'status' column from cameras.csv
            "active_cameras": self.cameras_df[self.cameras_df['status'] == 'ONLINE'].shape[0],
            "busiest_cameras": self.detections_df['cameraId'].value_counts().head(5).to_dict()
        }
        return summary
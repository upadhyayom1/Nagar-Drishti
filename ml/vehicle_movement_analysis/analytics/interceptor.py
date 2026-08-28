import pandas as pd
import json
import os
from collections import defaultdict

class VehicleInterceptor:
    def __init__(self, detections_df: pd.DataFrame, cameras_df: pd.DataFrame, blacklist_json_path: str):
        self.detections_df = detections_df.copy() if detections_df is not None else pd.DataFrame()
        
        self.v_id_col = next((c for c in ['vehicleId', 'vehicle_id', 'id'] if c in self.detections_df.columns), 'id')
        self.cam_col = next((c for c in ['cameraCode', 'cameraId', 'camera_id'] if c in self.detections_df.columns), 'cameraCode')
        
        if 'timestamp' in self.detections_df.columns:
            self.detections_df['timestamp'] = pd.to_datetime(self.detections_df['timestamp'], format='mixed', errors='coerce')
            self.detections_df = self.detections_df.sort_values([self.v_id_col, 'timestamp'])

        self.cameras_df = cameras_df.copy() if cameras_df is not None else pd.DataFrame()
        self.cam_lookup = {}
        
        if not self.cameras_df.empty:
            print("DEBUG: cameras.csv loaded. Columns:", self.cameras_df.columns.tolist())
            
            # Identify columns dynamically
            cam_index_col = next((c for c in ['id', 'cameraId', 'camera_id', 'cameraCode', 'camera_code'] if c in self.cameras_df.columns), None)
            cam_name_col = next((c for c in ['name', 'cameraName', 'camera_name', 'title'] if c in self.cameras_df.columns), None)
            cam_lat_col = next((c for c in ['latitude', 'lat', 'LAT'] if c in self.cameras_df.columns), None)
            cam_lon_col = next((c for c in ['longitude', 'lon', 'lng', 'LONG'] if c in self.cameras_df.columns), None)
            
            print(f"DEBUG: Found Camera Cols -> ID: {cam_index_col}, Name: {cam_name_col}, Lat: {cam_lat_col}, Lon: {cam_lon_col}")

            if cam_index_col:
                # Build a robust lookup dictionary mapping lowercase, whitespace-stripped IDs to their details
                for _, row in self.cameras_df.iterrows():
                    raw_id = str(row[cam_index_col]).strip().lower()
                    self.cam_lookup[raw_id] = {
                        "name": str(row[cam_name_col]) if cam_name_col and pd.notnull(row[cam_name_col]) else None,
                        "lat": float(row[cam_lat_col]) if cam_lat_col and pd.notnull(row[cam_lat_col]) else None,
                        "lon": float(row[cam_lon_col]) if cam_lon_col and pd.notnull(row[cam_lon_col]) else None
                    }

        self.blacklist_json_path = blacklist_json_path
        self.transition_matrix = self._build_transition_matrix()

    def _build_transition_matrix(self):
        transitions = defaultdict(lambda: defaultdict(int))
        if self.v_id_col not in self.detections_df.columns or self.cam_col not in self.detections_df.columns:
            return {}

        for _, group in self.detections_df.groupby(self.v_id_col):
            cam_sequence = group[self.cam_col].dropna().astype(str).tolist()
            for i in range(len(cam_sequence) - 1):
                curr = cam_sequence[i].strip()
                nxt = cam_sequence[i+1].strip()
                if curr != nxt:
                    transitions[curr][nxt] += 1
                    
        probability_matrix = {}
        for curr, nexts in transitions.items():
            total = sum(nexts.values())
            probability_matrix[curr] = {
                nxt: round(cnt / total, 4)
                for nxt, cnt in sorted(nexts.items(), key=lambda x: x[1], reverse=True)
            }
        return probability_matrix

    def load_blacklisted_vehicles(self):
        if not os.path.exists(self.blacklist_json_path):
            return []
        try:
            with open(self.blacklist_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    for key in ["vehicles", "data", "blacklisted", "items"]:
                        if key in data and isinstance(data[key], list):
                            return data[key]
                    return [data]
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Error reading blacklist JSON: {e}")
            return []

    def predict_next_for_vehicle(self, vehicle_id: str, top_n: int = 3):
        blacklisted_vehicles = self.load_blacklisted_vehicles()
        clean_query = str(vehicle_id).replace(" ", "").replace("-", "").strip().upper()
        
        target_vehicle = None
        for v in blacklisted_vehicles:
            possible_match_vals = [
                str(v.get("vehicle_id", "")),
                str(v.get("vehicleId", "")),
                str(v.get("id", "")),
                str(v.get("plate", "")),
                str(v.get("plateNumber", "")),
                str(v.get("plateText", "")),
                str(v.get("blacklistId", ""))
            ]
            
            cleaned_vals = [val.replace(" ", "").replace("-", "").strip().upper() for val in possible_match_vals if val]
            if clean_query in cleaned_vals:
                target_vehicle = v
                break
        
        if not target_vehicle:
            return {"error": f"Vehicle ID '{vehicle_id}' not found in active blacklist records."}
            
        current_checkpoint = target_vehicle.get("current_checkpoint", {})
        if not isinstance(current_checkpoint, dict):
            current_checkpoint = {}
            
        current_cam_id = str(current_checkpoint.get("camera_id") or current_checkpoint.get("cameraCode") or "").strip()
        current_cam_name = current_checkpoint.get("camera_name") or current_checkpoint.get("name") or "Unknown"
        
        possible_next = self.transition_matrix.get(current_cam_id, {})
        
        if not possible_next and not self.detections_df.empty:
            top_cams = self.detections_df[self.cam_col].value_counts().head(top_n).index.tolist()
            possible_next = {cam: round(1.0 / len(top_cams), 2) for cam in top_cams}

        sorted_next = sorted(possible_next.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        predictions = []
        for next_cam_id, prob in sorted_next:
            cam_name = next_cam_id
            lat, lon = None, None
            
            # Use the robust dictionary lookup, stripping spaces and matching lowercase
            lookup_id = str(next_cam_id).strip().lower()
            if hasattr(self, 'cam_lookup') and lookup_id in self.cam_lookup:
                cam_info = self.cam_lookup[lookup_id]
                cam_name = cam_info["name"] if cam_info["name"] else next_cam_id
                lat = cam_info["lat"]
                lon = cam_info["lon"]
                
            predictions.append({
                "camera_id": next_cam_id,
                "camera_name": str(cam_name),
                "probability": prob,
                "latitude": lat,
                "longitude": lon
            })
            
        resolved_id = target_vehicle.get("vehicle_id") or target_vehicle.get("vehicleId") or target_vehicle.get("id") or vehicle_id
        resolved_plate = target_vehicle.get("plate") or target_vehicle.get("plateNumber") or target_vehicle.get("plateText") or ""

        return {
            "vehicle_id": resolved_id,
            "plate": resolved_plate,
            "last_seen_timestamp": target_vehicle.get("last_seen_timestamp") or target_vehicle.get("updatedAt"),
            "current_checkpoint": {
                "camera_id": current_cam_id,
                "camera_name": current_cam_name
            },
            "predicted_next_checkpoints": predictions
        }
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from forecasting.feature_extractor import build_supervised_features, load_and_aggregate_detections

class TrafficCongestionPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.is_trained = False

    def train_model(self, horizon_mins: int = 30):
        df_train = build_supervised_features(target_horizon_mins=horizon_mins)
        
        feature_cols = ["vehicle_count", "lag_1", "lag_2", "rolling_mean_4", "horizon_parameter_mins", "hour_of_day", "day_of_week"]
        
        if df_train.empty or len(df_train) < 5:
            # Insufficient historical log rows; model stays untrained, fallback heuristics active
            self.is_trained = False
            return False

        X = df_train[feature_cols]
        y = df_train["target_future_count"]
        
        self.model.fit(X, y)
        self.is_trained = True
        return True

    def predict_congestion(self, horizon_mins: int = 30, capacity_threshold: int = 15):
        # Ensure model is trained for this session
        if not self.is_trained:
            self.train_model(horizon_mins=horizon_mins)

        latest_data = load_and_aggregate_detections()
        if latest_data.empty:
            return {"horizon_mins": horizon_mins, "bottlenecks_detected": [], "status": "No historical detection logs found."}

        predictions = []
        # Evaluate latest known point per camera
        for camera_id, group in latest_data.groupby("camera_id"):
            group = group.sort_values("time_bin")
            last_row = group.iloc[-1]
            current_count = last_row["vehicle_count"]
            zone = last_row.get("zone_id", "UNKNOWN")

            if self.is_trained:
                # Construct feature vector for inference
                sample = pd.DataFrame([{
                    "vehicle_count": current_count,
                    "lag_1": group.iloc[-2]["vehicle_count"] if len(group) > 1 else current_count,
                    "lag_2": group.iloc[-3]["vehicle_count"] if len(group) > 2 else current_count,
                    "rolling_mean_4": group["vehicle_count"].tail(4).mean(),
                    "horizon_parameter_mins": horizon_mins,
                    "hour_of_day": pd.Timestamp.now().hour,
                    "day_of_week": pd.Timestamp.now().dayofweek
                }])
                pred_count = float(self.model.predict(sample)[0])
            else:
                # Heuristic fallback if records are sparse
                pred_count = float(current_count * (1.0 + (horizon_mins / 120.0)))

            is_bottleneck = pred_count >= capacity_threshold
            predictions.endswith if hasattr(predictions, "endswith") else None # placeholder safe check
            predictions.append({
                "camera_id": camera_id,
                "zone_id": zone,
                "current_vehicle_count": int(current_count),
                "predicted_vehicle_count": round(pred_count, 2),
                "congestion_risk": "HIGH" if is_bottleneck else "NORMAL"
            })

        bottlenecks = [p for p in predictions if p["congestion_risk"] == "HIGH"]
        return {
            "horizon_minutes": horizon_mins,
            "total_cameras_monitored": len(predictions),
            "bottlenecks_count": len(bottlenecks),
            "forecast_details": predictions
        }
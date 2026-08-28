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
            self.is_trained = False
            return False

        X = df_train[feature_cols].fillna(0)
        y = df_train["target_future_count"].fillna(0)
        
        self.model.fit(X, y)
        self.is_trained = True
        return True

    def predict_congestion(self, horizon_mins: int = 30, capacity_threshold: int = 15):
        if not self.is_trained:
            self.train_model(horizon_mins=horizon_mins)

        latest_data = load_and_aggregate_detections()
        if latest_data.empty:
            return {"horizon_mins": horizon_mins, "bottlenecks_detected": [], "status": "No historical detection logs found."}

        predictions = []
        for camera_id, group in latest_data.groupby("camera_id"):
            group = group.sort_values("time_bin")
            last_row = group.iloc[-1]
            current_count = last_row["vehicle_count"]
            raw_zone = last_row.get("zone_id")
            zone = "Unassigned" if pd.isna(raw_zone) else str(raw_zone)

            if self.is_trained:
                lag_1_val = group.iloc[-2]["vehicle_count"] if len(group) > 1 else current_count
                lag_2_val = group.iloc[-3]["vehicle_count"] if len(group) > 2 else current_count
                roll_mean = group["vehicle_count"].tail(4).mean()
                
                sample = pd.DataFrame([{
                    "vehicle_count": float(current_count),
                    "lag_1": float(lag_1_val),
                    "lag_2": float(lag_2_val),
                    "rolling_mean_4": float(roll_mean) if not pd.isna(roll_mean) else float(current_count),
                    "horizon_parameter_mins": int(horizon_mins),
                    "hour_of_day": int(pd.Timestamp.now().hour),
                    "day_of_week": int(pd.Timestamp.now().dayofweek)
                }]).fillna(0)
                
                pred_count = float(self.model.predict(sample)[0])
            else:
                pred_count = float(current_count * (1.0 + (horizon_mins / 120.0)))

            # Sanitize potential NaN or inf values from predictions
            if np.isnan(pred_count) or np.isinf(pred_count):
                pred_count = float(current_count)

            is_bottleneck = pred_count >= capacity_threshold
            predictions.append({
                "camera_id": str(camera_id),
                "zone_id": str(zone),
                "current_vehicle_count": int(current_count),
                "predicted_vehicle_count": round(float(pred_count), 2),
                "congestion_risk": "HIGH" if is_bottleneck else "NORMAL"
            })

        bottlenecks = [p for p in predictions if p["congestion_risk"] == "HIGH"]
        return {
            "horizon_minutes": int(horizon_mins),
            "total_cameras_monitored": len(predictions),
            "bottlenecks_count": len(bottlenecks),
            "forecast_details": predictions
        }
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from forecasting.feature_extractor import build_supervised_features, load_and_aggregate_detections


FEATURE_COLS = [
    "vehicle_count",
    "lag_1",
    "lag_2",
    "rolling_mean_4",
    "horizon_parameter_mins",
    "hour_of_day",
    "day_of_week",
]


class TrafficCongestionPredictor:
    def __init__(self):
        self.models = {}
        self.training_rows = {}

    def _get_model(self, horizon_mins: int):
        horizon = int(max(15, horizon_mins))
        model = self.models.get(horizon)
        if model is not None:
            return model

        df_train = build_supervised_features(target_horizon_mins=horizon)
        if df_train.empty or len(df_train) < 20:
            return None

        model = RandomForestRegressor(
            n_estimators=120,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        X = df_train[FEATURE_COLS].replace([np.inf, -np.inf], np.nan).fillna(0)
        y = df_train["target_future_count"].replace([np.inf, -np.inf], np.nan).fillna(0)
        model.fit(X, y)
        self.models[horizon] = model
        self.training_rows[horizon] = len(df_train)
        return model

    def train_model(self, horizon_mins: int = 30):
        return self._get_model(horizon_mins) is not None

    def predict_congestion(self, horizon_mins: int = 30, capacity_threshold: int = 15):
        horizon_mins = int(max(15, horizon_mins))
        capacity_threshold = max(1, int(capacity_threshold))
        latest_data = load_and_aggregate_detections()

        if latest_data.empty:
            return {
                "horizon_minutes": horizon_mins,
                "bottlenecks_detected": [],
                "status": "No historical detection logs found.",
            }

        model = self._get_model(horizon_mins)
        predictions = []

        for camera_id, group in latest_data.groupby("camera_id"):
            group = group.sort_values("time_bin")
            last_row = group.iloc[-1]
            current_count = float(last_row["vehicle_count"])
            lag_1 = float(group.iloc[-2]["vehicle_count"]) if len(group) > 1 else current_count
            lag_2 = float(group.iloc[-3]["vehicle_count"]) if len(group) > 2 else lag_1
            rolling = float(group["vehicle_count"].tail(4).mean())
            target_time = pd.Timestamp(last_row["time_bin"]) + pd.Timedelta(minutes=horizon_mins)

            sample = pd.DataFrame([{
                "vehicle_count": current_count,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "rolling_mean_4": rolling,
                "horizon_parameter_mins": horizon_mins,
                "hour_of_day": int(target_time.hour),
                "day_of_week": int(target_time.dayofweek),
            }])

            if model is not None:
                pred_count = float(model.predict(sample[FEATURE_COLS])[0])
            else:
                # Conservative fallback when there is not enough history to train.
                trend = current_count - lag_1
                pred_count = max(0.0, current_count + trend * max(1, horizon_mins / 15))

            if not np.isfinite(pred_count):
                pred_count = current_count

            pred_count = max(0.0, pred_count)
            risk = "HIGH" if pred_count >= capacity_threshold else "NORMAL"
            raw_zone = last_row.get("zone_id")
            zone = "Unassigned" if pd.isna(raw_zone) else str(raw_zone)

            predictions.append({
                "camera_id": str(camera_id),
                "zone_id": zone,
                "current_vehicle_count": int(round(current_count)),
                "predicted_vehicle_count": round(pred_count, 2),
                "congestion_risk": risk,
                "forecast_time": target_time.isoformat(),
            })

        bottlenecks = [p for p in predictions if p["congestion_risk"] == "HIGH"]
        return {
            "horizon_minutes": horizon_mins,
            "total_cameras_monitored": len(predictions),
            "bottlenecks_count": len(bottlenecks),
            "forecast_details": predictions,
            "model": {
                "trained": model is not None,
                "training_rows": self.training_rows.get(horizon_mins, 0),
            },
        }

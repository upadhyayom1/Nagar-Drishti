import sys
import os
import pandas as pd
import numpy as np
sys.path.append(os.path.join(os.getcwd(), 'vehicle_movement_analysis'))
from forecasting.feature_extractor import build_supervised_features
from sklearn.ensemble import RandomForestRegressor

df = build_supervised_features(30)
df["target_ratio"] = (df["target_future_count"] + 1) / (df["vehicle_count"] + 1)

FEATURE_COLS = [
    "vehicle_count",
    "lag_1",
    "lag_2",
    "rolling_mean_4",
    "horizon_parameter_mins",
    "hour_of_day",
    "day_of_week",
]

X = df[FEATURE_COLS].fillna(0)
y = df["target_ratio"].fillna(1.0)

model = RandomForestRegressor(n_estimators=20, min_samples_leaf=2, random_state=42)
model.fit(X, y)

def test_pred(count):
    sample = pd.DataFrame([{
        "vehicle_count": count,
        "lag_1": count * 0.9,
        "lag_2": count * 0.8,
        "rolling_mean_4": count * 0.85,
        "horizon_parameter_mins": 30,
        "hour_of_day": 14,
        "day_of_week": 2,
    }])
    pred_ratio = model.predict(sample[FEATURE_COLS])[0]
    return (count + 1) * pred_ratio - 1

print("Prediction for 50:", test_pred(50))
print("Prediction for 68:", test_pred(68))
print("Prediction for 100:", test_pred(100))


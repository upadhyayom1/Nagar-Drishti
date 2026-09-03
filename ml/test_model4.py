import sys
import os
import pandas as pd
import numpy as np
sys.path.append(os.path.join(os.getcwd(), 'vehicle_movement_analysis'))
from forecasting.feature_extractor import build_supervised_features
from sklearn.ensemble import RandomForestRegressor

df = build_supervised_features(30)

# Relative ratios
df["target_ratio"] = (df["target_future_count"] + 1) / (df["vehicle_count"] + 1)
df["lag_1_ratio"] = (df["lag_1"] + 1) / (df["vehicle_count"] + 1)
df["lag_2_ratio"] = (df["lag_2"] + 1) / (df["vehicle_count"] + 1)
df["rolling_mean_4_ratio"] = (df["rolling_mean_4"] + 1) / (df["vehicle_count"] + 1)

FEATURE_COLS = [
    "lag_1_ratio",
    "lag_2_ratio",
    "rolling_mean_4_ratio",
    "horizon_parameter_mins",
    "hour_of_day",
    "day_of_week",
]

X = df[FEATURE_COLS].fillna(1.0)
y = df["target_ratio"].fillna(1.0)

model = RandomForestRegressor(n_estimators=50, min_samples_leaf=2, random_state=42)
model.fit(X, y)

def test_pred(count, lag_1, lag_2):
    rolling = (count + lag_1 + lag_2 + lag_2) / 4
    sample = pd.DataFrame([{
        "lag_1_ratio": (lag_1 + 1) / (count + 1),
        "lag_2_ratio": (lag_2 + 1) / (count + 1),
        "rolling_mean_4_ratio": (rolling + 1) / (count + 1),
        "horizon_parameter_mins": 30,
        "hour_of_day": 14,
        "day_of_week": 2,
    }])
    pred_ratio = model.predict(sample[FEATURE_COLS])[0]
    return (count + 1) * pred_ratio - 1

print("Prediction for 68 (increasing trend, lag_1=50, lag_2=40):", test_pred(68, 50, 40))
print("Prediction for 68 (decreasing trend, lag_1=80, lag_2=90):", test_pred(68, 80, 90))
print("Prediction for 68 (steady trend, lag_1=68, lag_2=68):", test_pred(68, 68, 68))

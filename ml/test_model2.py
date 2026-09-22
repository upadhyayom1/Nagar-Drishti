import sys
import os
import pandas as pd
import numpy as np
sys.path.append(os.path.join(os.getcwd(), 'vehicle_movement_analysis'))
from forecasting.feature_extractor import build_supervised_features
from sklearn.ensemble import RandomForestRegressor

df = build_supervised_features(30)
df["target_diff"] = df["target_future_count"] - df["vehicle_count"]

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
y = df["target_diff"].fillna(0)

model = RandomForestRegressor(n_estimators=20, min_samples_leaf=2, random_state=42)
model.fit(X, y)

sample = pd.DataFrame([{
    "vehicle_count": 50,
    "lag_1": 45,
    "lag_2": 40,
    "rolling_mean_4": 35,
    "horizon_parameter_mins": 30,
    "hour_of_day": 14,
    "day_of_week": 2,
}])

pred_diff = model.predict(sample[FEATURE_COLS])[0]
print("Predicted diff:", pred_diff)
print("Predicted count:", 50 + pred_diff)


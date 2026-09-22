import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'vehicle_movement_analysis'))
from forecasting.feature_extractor import build_supervised_features

df = build_supervised_features(30)
print("Total rows:", len(df))
if len(df) > 0:
    print("Zero targets:", len(df[df['target_future_count'] == 0]))
    print("Max target:", df['target_future_count'].max())
    print("Max vehicle_count:", df['vehicle_count'].max())
    print("Mean vehicle_count:", df['vehicle_count'].mean())

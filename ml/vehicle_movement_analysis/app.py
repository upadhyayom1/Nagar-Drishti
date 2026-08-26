import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from analytics.movement_analyzer import analyze_ocr_movement

app = FastAPI(title="Nagar-Drishti Movement Analysis")

DATA_DIR = "data"
MERGED_DATA = None

@app.on_event("startup")
def load_and_prepare_csv_data():
    global MERGED_DATA
    
    roads_path = os.path.join(DATA_DIR, "roads.csv")
    zones_path = os.path.join(DATA_DIR, "zones.csv")
    cameras_path = os.path.join(DATA_DIR, "cameras.csv")
    detections_path = os.path.join(DATA_DIR, "detections.csv")

    roads = pd.read_csv(roads_path)
    zones = pd.read_csv(zones_path)
    cameras = pd.read_csv(cameras_path)
    detections = pd.read_csv(detections_path)

    # 1. Map camera code (e.g. C001 -> PRY-CAM-001)
    detections['mapped_code'] = detections['cameraCode'].apply(lambda c: f"PRY-CAM-{int(c[1:]):03d}")

    # 2. Merge specifying suffixes to preserve original column names
    merged = detections.merge(cameras, left_on='mapped_code', right_on='cameraCode', how='left', suffixes=('', '_cam'))
    merged = merged.merge(roads, left_on='roadId', right_on='id', how='left', suffixes=('', '_road'))
    merged = merged.merge(zones, left_on='zoneId', right_on='id', how='left', suffixes=('', '_zone'))

    MERGED_DATA = merged

@app.get("/", response_class=HTMLResponse)
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Nagar-Drishti OCR Movement Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 40px; }
            h1 { color: #38bdf8; }
            .card { background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            input, button { padding: 10px; border-radius: 4px; border: none; font-size: 16px; }
            button { background: #0284c7; color: white; cursor: pointer; }
            pre { background: #020617; padding: 15px; border-radius: 6px; overflow-x: auto; color: #4ade80; }
        </style>
    </head>
    <body>
        <h1>ANPR Vehicle Movement Analysis (Real CSV Stream)</h1>
        <div class="card">
            <input type="text" id="queryInput" placeholder="Enter Vehicle ID or Plate (e.g. DL08LG1722)">
            <button onclick="analyze()">Analyze OCR Data</button>
        </div>
        <div class="card">
            <h3>Pipeline Output</h3>
            <pre id="output">Enter a Plate/Vehicle ID to query...</pre>
        </div>

        <script>
            async function analyze() {
                const query = document.getElementById('queryInput').value.trim();
                if(!query) return;
                const res = await fetch('/api/analyze/' + query);
                const data = await res.json();
                document.getElementById('output').textContent = JSON.stringify(data, null, 2);
            }
        </script>
    </body>
    </html>
    """

@app.get("/api/analyze/{identifier}")
def analyze_vehicle(identifier: str):
    if MERGED_DATA is None:
        raise HTTPException(status_code=500, detail="Data pipeline not initialized.")

    result = analyze_ocr_movement(MERGED_DATA, identifier, dwell_threshold_mins=8.0)
    if not result:
        raise HTTPException(status_code=404, detail=f"Vehicle '{identifier}' not found in detections.")
    
    return result
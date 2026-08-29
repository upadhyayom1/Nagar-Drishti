import sys
import os
from pathlib import Path

# Add the microservices to the Python path so their internal relative imports work correctly
ROOT_DIR = Path(__file__).resolve().parent
sys.path.append(str(ROOT_DIR / "ml" / "vehicle_movement_analysis"))
sys.path.append(str(ROOT_DIR / "license_plate_number_extraction"))

from fastapi import FastAPI
import uvicorn

# Import the ML Movement Analysis application
from app import app as ml_app

# Import the YOLO ANPR application
from api import app as anpr_app

# Create the unified gateway application
app = FastAPI(
    title="Nagar-Drishti Unified ML & ANPR Gateway",
    description="Unified API gateway hosting both the Vehicle Movement Analysis ML and the YOLO ANPR microservices.",
    version="1.0"
)

# Mount the sub-applications
app.mount("/ml", ml_app)
app.mount("/anpr", anpr_app)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "unified-api-gateway"}

@app.on_event("startup")
def startup_event():
    import app as ml_module
    ml_module.startup_event()
    print("Triggered ML service initialization.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

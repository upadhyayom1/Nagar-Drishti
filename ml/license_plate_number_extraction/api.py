import copy
import os
import shutil
import tempfile
from pathlib import Path

import cv2
import yaml
from fastapi import FastAPI, File, HTTPException, UploadFile

from src.pipeline.anpr_pipeline import ANPRPipeline


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / "config.yaml"
app = FastAPI(title="Nagar-Drishti Local YOLO ANPR API", version="1.0")


def load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        config = yaml.safe_load(config_file)
    config["models"]["vehicle_detector"] = str((BASE_DIR / config["models"]["vehicle_detector"]).resolve())
    config["models"]["plate_detector"] = str((BASE_DIR / config["models"]["plate_detector"]).resolve())
    return config


def resolve_device(requested: str) -> str:
    if requested != "auto":
        return requested
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def image_to_video(image_path: Path, destination: Path):
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Uploaded image cannot be decoded")
    height, width = image.shape[:2]
    writer = cv2.VideoWriter(str(destination), cv2.VideoWriter_fourcc(*"mp4v"), 5, (width, height))
    if not writer.isOpened():
        raise ValueError("Unable to prepare image for YOLO processing")
    for _ in range(15):
        writer.write(image)
    writer.release()


@app.get("/health")
def health():
    weights = BASE_DIR / "models" / "plate" / "license_plate_yolov8.pt"
    return {"status": "ok", "provider": "local-yolo-anpr", "modelAvailable": weights.exists()}


@app.post("/api/recognize")
async def recognize(file: UploadFile = File(...)):
    if not file.content_type or not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Upload an image or video file")

    with tempfile.TemporaryDirectory(prefix="nagar-drishti-anpr-") as temp_directory:
        temp_path = Path(temp_directory)
        suffix = Path(file.filename or "upload").suffix or (".mp4" if file.content_type.startswith("video/") else ".jpg")
        upload_path = temp_path / f"upload{suffix}"
        with upload_path.open("wb") as output_file:
            shutil.copyfileobj(file.file, output_file)

        source_path = upload_path
        if file.content_type.startswith("image/"):
            source_path = temp_path / "image-input.mp4"
            image_to_video(upload_path, source_path)

        config = copy.deepcopy(load_config())
        config["output"].update({
            "json_path": str(temp_path / "results.json"),
            "csv_path": str(temp_path / "results.csv"),
            "annotated_video_path": str(temp_path / "annotated.mp4"),
            "save_annotated_video": False,
        })
        config["logging"]["log_file"] = str(temp_path / "anpr.log")

        try:
            pipeline = ANPRPipeline(config=config, device=resolve_device(config.get("device", "auto")))
            results = pipeline.run(str(source_path), config["output"], config["video"])
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Local ANPR inference failed: {error}") from error

        try:
            from main import enforce_indian_plate_constraints
        except ImportError:
            # Fallback if main.py can't be imported for some reason
            enforce_indian_plate_constraints = lambda x: x

        return {
            "provider": "local-yolo-anpr",
            "results": [
                {
                    "plateNumber": enforce_indian_plate_constraints(result.plate_number) if result.plate_number else None,
                    "confidence": result.confidence,
                    "vehicleType": result.vehicle_type,
                    "status": result.status,
                    "framesUsed": result.frames_used,
                    "reason": result.reason,
                }
                for result in results
            ],
        }

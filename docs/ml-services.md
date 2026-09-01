# Local ML Services

The Node backend calls two Python services. Run each service before starting the backend.

## Next-camera movement service

```bash
cd ml/vehicle_movement_analysis
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

Verify it with `curl http://127.0.0.1:8001/health`.

## Local YOLO licence-plate extraction service

```bash
cd license_plate_number_extraction
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8002
```

Verify it with `curl http://127.0.0.1:8002/health`.

The local files `yolov8n.pt` and `models/plate/license_plate_yolov8.pt` must be present. The first EasyOCR run may download its recognition weights.

## Backend configuration

Set these values in `backend/.env` when the services run on other hosts:

```env
ML_SERVICE_URL=http://127.0.0.1:8001
ANPR_SERVICE_URL=http://127.0.0.1:8002
```

Start the Node backend only after both health endpoints respond. The `/detect` page then uses local YOLO/EasyOCR, and `/blacklist` receives next-camera predictions from the movement service.

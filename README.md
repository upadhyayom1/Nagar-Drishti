# 🌆 Nagar-Drishti

## AI-Powered Urban Traffic Intelligence & Predictive Monitoring Platform

Nagar-Drishti is an AI-powered urban traffic intelligence platform designed to analyze vehicle movement across multiple camera points, perform automatic number-plate recognition, identify unusual movement patterns, monitor blacklisted vehicles, and provide traffic analytics and forecasting through a unified dashboard.

---

## 🎯 What It Solves

Traditional urban traffic management relies heavily on manual monitoring, reactive responses to congestion, and fragmented data sources.

**Nagar-Drishti** solves these critical bottlenecks by:

* 🤖 **Automating Surveillance:** Eliminates manual tracking overhead through continuous AI-powered processing.
* ⚡ **Proactive Interception:** Flags abnormal vehicle movements, congestion hotspots, and road anomalies before they cause gridlocks.
* 📊 **Unified Intelligence:** Bridges raw camera and zone data into a centralized dashboard for faster municipal response times.

---

## ✨ Key Features

## 1. 🔐 Authentication

- JWT-based authentication.
- HTTP-only cookie based sessions.
- Protected backend routes for sensitive operations.

---

## 2. 📊 Unified Traffic Dashboard

The dashboard provides a centralized view of the traffic network across different regions.

### Includes:

- Vehicle Movement Analysis 
- Traffic density/congestion information.
- Traffic trends.
- Camera activity.
- Active alerts.
- Blacklisted vehicle information

---

## 3. 🔤 AI-Based Automatic Number Plate Recognition

Nagar-Drishti includes a local computer-vision ANPR pipeline for processing images and videos.

The system can process uploaded image or video evidence through the ANPR service.

---

## 4. 🚗 Vehicle Intelligence & Tracking

Search and investigate vehicles using their license plates.

### Features:

- Vehicle profile and detection history.
- Camera, timestamp, speed information.
- Number of cameras visited.
- Historical vehicle trajectory and its visualization.
- Average and maximum segment speed and dwell-time analysis.

### ML Techniques Used:

- **Isolation Forest** for identifying unusual combinations of movement speed and time-gap behaviour.
- **DBSCAN** for identifying clusters of frequently observed vehicle locations.

---

## 5. 🛑 Blacklist Intelligence

Authorities can add vehicle license plates to a monitored blacklist.

### Features:

- Add vehicles to the blacklist with reason and severity..
- Monitor active/inactive blacklist records.
- Generate a blacklist-match alert when a match occurs.
- Display last-sighted information and show vehicle movement intelligence.
- Predict the next probable camera location.

---

## 6. 📍 Next-Camera Prediction

Nagar-Drishti uses observed camera-to-camera transitions to estimate where the blacklisted vehicle is likely to appear next.

The prediction considers:

- Historical network transitions, vehicle-specific transition history, observed travel times and transition probabilities.

The system returns:

- Most probable next camera and alternative probable cameras.
- Probability score.
- Estimated arrival time when available.

---

## 7. 🚦 Traffic Forecasting

The platform provides future traffic-volume predictions for individual camera nodes.

### Model:

**Random Forest Regressor**

### Features include:

- Current + Previous vehicle count.
- Rolling traffic average.
- Forecast horizon.
- Hour of day +  Day of week..

The system can forecast custom future horizon for any given input time.
It also flags cameras as higher-risk bottlenecks when predicted vehicle volume crosses the configured threshold.

---

## 🛠️ Tech Stack

| Layer                  | Technologies                              |
| ---------------------- | ----------------------------------------- |
| **Frontend**           | React.js , Next.js, Tailwind CSS          |
| **Backend**            | Node.js, Express.js FastAPI                           |
| **Database & Storage** | PostgreSQL            |
| **AI & ML**  | YOLO,OCR,ML Models  |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Install:

- Node.js 18.17+
- npm
- Python 3.x
- PostgreSQL 
- Git

### 2. Clone the Repository

```bash
git clone https://github.com/upadhyayom1/Nagar-Drishti.git
cd Nagar-Drishti
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

**Activate the virtual environment:**

**Windows:**

```bash
venv\Scripts\activate
```

**Linux / macOS:**

```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add the required database credentials and API keys:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="1d"

PORT=8000
NODE_ENV="development"

CORS_ORIGINS="http://localhost:3000"

ML_SERVICE_URL="http://127.0.0.1:8001/ml"
ANPR_SERVICE_URL="http://127.0.0.1:8001/anpr"
```

### 4. Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
Nagar-Drishti/
│
├── backend/
│   ├── api/              # FastAPI routers and endpoints
│   ├── core/             # Configuration and security modules
│   ├── models/           # Database models and schemas
│   └── services/         # AI processing and forecasting logic
│
├── frontend/
│   ├── public/           # Static assets and images
│   ├── src/              # React components, pages, and styles
│   └── package.json
│
└── README.md
```

---

## 🔄 Workflow 

The following demonstrates how Nagar-Drishti processes traffic data:

```text
1. Vehicle appears in a CCTV/video input
              ↓
2. YOLO detects the vehicle and license-plate region
              ↓
3. Vehicle tracking maintains the vehicle across frames
              ↓
4. High-quality plate observations are collected
              ↓
5. EasyOCR reads the license plate
              ↓
6. OCR readings from multiple frames are fused
              ↓
7. Plate format is validated and confidence is calculated
              ↓
8. Detection is stored with camera + timestamp + vehicle data
              ↓
9. Plate is checked against the blacklist
              ↓
10. If matched, a BLACKLIST_MATCH alert is generated
              ↓
11. Dashboard displays the vehicle and alert
```

### Workflow Steps

1. **Data Ingestion:** Live video feeds from city traffic cameras stream into the system.
2. **AI Processing:** The backend processes vehicle movement patterns and performs ANPR and trajectory matching.
3. **Prediction & Alert:** The ML layer evaluates traffic conditions and congestion thresholds to identify potential bottlenecks.
4. **Action:** Municipal authorities receive alerts through the dashboard and can proactively dispatch traffic management teams.

---

## 🚀 Future Roadmap

* 👮 Authority → 👤 Public Platform

Currently focused on traffic authorities; extend the platform to citizens/users for public-facing traffic intelligence.

* 🗺️ Route Anomaly Detection

Identify deviations from expected vehicle routes and flag unusual route behaviour for further investigation.

* 📱 User-Facing Traffic Insights

Provide users with useful information such as traffic conditions, congestion hotspots, and route-level insights.

* 🤝 Citizen–Authority Integration

Enable users to report traffic incidents/issues and help authorities incorporate citizen-generated information into traffic monitoring.

---

## 👥 Contributors

| Team Member       | Role                   |
| ----------------- | ---------------------- |
| **Team Member 1** | System Core            |
| **Team Member 2** | Interface Sculptor     |
| **Team Member 3** | Neural Architect       |
| **Team Member 4** | Data Pipeline Engineer |
| **Team Member 5** | Backend Integration    |
| **Team Member 6** | Documentation & QA     |

---

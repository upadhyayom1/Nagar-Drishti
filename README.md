# 🌆 Nagar-Drishti

## AI-Powered Urban Traffic Intelligence & Predictive Monitoring Platform

---

## 🎯 What It Solves

Traditional urban traffic management relies heavily on manual monitoring, reactive responses to congestion, and fragmented data sources.

**Nagar-Drishti** solves these critical bottlenecks by:

* 🤖 **Automating Surveillance:** Eliminates manual tracking overhead through continuous AI-powered processing.
* ⚡ **Proactive Interception:** Flags abnormal vehicle movements, congestion hotspots, and road anomalies before they cause gridlocks.
* 📊 **Unified Intelligence:** Bridges raw camera and zone data into a centralized dashboard for faster municipal response times.

---

## ✨ Key Features

### 👁️ Multi-Camera ANPR Tracking

Real-time Automatic Number Plate Recognition (ANPR) and vehicle trajectory mapping across multiple traffic cameras.

### 📈 Predictive Traffic Forecasting

Uses machine learning models to anticipate traffic density and expected road conditions.

### 🚨 Automated Incident Alerting

Instantly notifies authorities about critical road conditions, sudden congestion, and abnormal traffic patterns.

### 🖥️ Centralized Command Dashboard

A clean and intuitive interface that allows municipal operators to monitor and manage urban traffic zones seamlessly.

---

## 🛠️ Tech Stack

| Layer                  | Technologies                              |
| ---------------------- | ----------------------------------------- |
| **Frontend**           | React.js / Next.js, Tailwind CSS          |
| **Backend**            | Python, FastAPI                           |
| **Database & Storage** | PostgreSQL, SQLAlchemy, Redis             |
| **AI & Intelligence**  | Computer Vision Models, Google Gemini API |

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

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
DATABASE_URL=your_postgres_connection_string
REDIS_URL=your_redis_connection_string
GEMINI_API_KEY=your_gemini_api_key
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

## 🔄 One Workflow Example

The following demonstrates how Nagar-Drishti processes traffic data:

```text
Live Camera Feeds
       ↓
Data Ingestion
       ↓
AI Processing
       ↓
ANPR + Vehicle Tracking
       ↓
Traffic Analysis & Prediction
       ↓
Incident / Congestion Alert
       ↓
Centralized Dashboard
       ↓
Municipal Response
```

### Workflow Steps

1. **Data Ingestion:** Live video feeds from city traffic cameras stream into the system.
2. **AI Processing:** The backend processes vehicle movement patterns and performs ANPR and trajectory matching.
3. **Prediction & Alert:** The ML layer evaluates traffic conditions and congestion thresholds to identify potential bottlenecks.
4. **Action:** Municipal authorities receive alerts through the dashboard and can proactively dispatch traffic management teams.

---

## 🚀 Future Roadmap

* [ ] Integration with IoT-enabled smart traffic signals for automated signal timing adjustments.
* [ ] Mobile application for field traffic officers and rapid ground reporting.
* [ ] Expansion of predictive models to incorporate weather and public event data.
* [ ] Enhanced multi-camera vehicle trajectory tracking.
* [ ] Real-time analytics and historical traffic trend visualization.

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

## 📌 Project Vision

> **Nagar-Drishti aims to transform urban traffic management from reactive monitoring into proactive, data-driven decision making.**

By combining computer vision, machine learning, predictive analytics, and centralized monitoring, the platform enables authorities to identify emerging traffic issues earlier and respond more efficiently.

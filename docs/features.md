# Nagar Drishti - System Features & Flows
*Living Documentation - Last Updated: August 2026*

This document serves as a comprehensive memory and reference for all features, flows, and capabilities of the Nagar Drishti platform. It should be updated whenever new features are added or existing ones are modified.

---

## 1. Authentication & Role Management
**Flow**: Users authenticate via the `/auth/login` endpoint using JWT tokens (managed in HTTP-only cookies).
- **Roles**: `ADMIN`, `OPERATOR`, `USER`.
- **Features**:
  - Secure JWT session management.
  - Role-based UI elements (e.g., specific admin dashboards).
  - Protected API routes ensuring only authorized personnel can access sensitive traffic/camera data.

## 2. Dashboard & Analytics Overview
**Flow**: The frontend makes requests to `/api/analytics/*` to fetch aggregated data.
- **Features**:
  - **Live Traffic Stats**: Displays active vehicles, average speed, congestion levels, and anomaly counts.
  - **Hourly Traffic Trends**: A line chart showing traffic volume over the past 24 hours.
  - **Camera Activity & Busiest Routes**: Shows which cameras are detecting the most traffic and which routes are currently congested.
  - **System Health & Network Analytics**: Shows the operational status of the camera nodes, active alerts count, and total daily detections.

## 3. Vehicle Tracking & Search
**Flow**: The `VehicleService` fetches from `/api/vehicles/*` and `/api/detections/*`.
- **Features**:
  - **Global Search**: Search for vehicles by full or partial license plate number.
  - **Vehicle Detail View**: Shows the complete history of a vehicle's detections across the camera network, including timestamps, speeds, and the specific camera node.
  - **Trajectory Mapping**: Plots the vehicle's historical path on the interactive map by connecting the locations of the cameras that detected it in chronological order.

## 4. Camera Network Management
**Flow**: Fetches camera definitions and live statuses from `/api/cameras`.
- **Features**:
  - Displays all physical or simulated camera nodes in Prayagraj.
  - Each camera has a detail page showing its recent detections, live status, and exact geographical coordinates.

## 5. Alerts & Notifications System
**Flow**: Frontend periodically polls `/api/alerts/notifications` every 5 seconds when the notification panel is open.
- **Features**:
  - **Real-time Notifications**: Alerts operators about critical events like Traffic Congestion, Route Anomalies, or Blacklisted Vehicle Matches.
  - **Notification Panel**: Displays the total count of *Active* (unresolved) alerts in the database. 
  - **Alert Management**: Operators can mark alerts as `ACKNOWLEDGED` or `RESOLVED`, which updates their status in the database and removes them from the active count.
  - *Note on "53 Notifications"*: If you see exactly 53 notifications, it means there are exactly 53 alerts with the status `ACTIVE` in your PostgreSQL database. They will remain there until an operator clicks them to acknowledge/resolve them.

## 6. Blacklist Intelligence (Threat Detection)
**Flow**: Managed via `/api/blacklist/*`.
- **Features**:
  - **Add to Blacklist**: Operators can flag specific license plates as threats (e.g., stolen, wanted).
  - **Intelligence Matching**: When a vehicle is detected by the OCR engine, the system automatically checks it against the blacklist. If there is a match, a `BLACKLIST_MATCH` alert is immediately generated and sent to the notifications panel.

## 7. OCR & Simulation Engine
**Flow**: Runs internally on the Node.js backend (`modules/simulation/engine.js`).
- **Features**:
  - **Traffic Simulation**: Because live camera feeds might not always be available during development, the backend runs a sophisticated simulation engine that generates realistic vehicle movements across the Prayagraj road network.
  - **Automated Detections**: As simulated vehicles pass virtual camera nodes, "detections" are logged into the database, powering the analytics and tracking features.

## 8. Incident & Complaint Management (Public/Admin)
**Flow**: Public submissions hit `/api/complaints`, which admins review at `/api/admin/complaints`.
- **Features**:
  - Citizens can submit traffic violations or incidents (potholes, accidents) with images.
  - Admins have a dedicated view to update the status of these complaints (e.g., IN_PROGRESS, RESOLVED).

## 9. Map Interface (Geospatial View)
**Flow**: Uses Mapbox/Leaflet on the frontend to visualize the `Road` and `Camera` data fetched from the backend.
- **Features**:
  - Visualizes all camera nodes as markers.
  - Visualizes the road network as lines, dynamically colored based on current congestion levels.
  - Interactive nodes allow clicking a camera to see its live feed/stats.

---
*Future queries regarding the system's architecture should reference this file, and any new features added to the codebase must be documented here to maintain future memory.*

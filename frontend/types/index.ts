export type CameraStatus = 'online' | 'warning' | 'offline';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'BLACKLIST_VEHICLE' | 'ROUTE_ANOMALY' | 'TRAFFIC_SURGE' | 'CAMERA_OFFLINE';
export type TrafficLevel = 'low' | 'moderate' | 'high' | 'congested';

export interface Camera {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: CameraStatus;
  trafficLevel: TrafficLevel;
  vehiclesDetected: number;
  fps: number;
  lastUpdated: string;
  zone: string;
}

export interface Detection {
  id: string;
  vehiclePlate: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  confidence: number;
  vehicleType: string;
  speed: number;
  direction: string;
  imageUrl?: string;
}

export interface Vehicle {
  plate: string;
  vehicleType: string;
  color: string;
  firstSeen: string;
  lastSeen: string;
  totalDetections: number;
  camerasVisited: number;
  status: 'normal' | 'watchlist' | 'blacklist';
  owner?: string;
  registeredCity?: string;
}

export interface VehicleJourney {
  plate: string;
  waypoints: Waypoint[];
  totalDistance: number;
  totalDuration: number;
  avgSpeed: number;
}

export interface Waypoint {
  cameraId: string;
  cameraName: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  direction: string;
}

export interface Route {
  id: string;
  name: string;
  vehicleCount: number;
  avgSpeed: number;
  congestionLevel: TrafficLevel;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  vehiclePlate?: string;
  cameraId: string;
  cameraName: string;
  location: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface TrafficStats {
  totalVehiclesToday: number;
  avgSpeed: number;
  activeCameras: number;
  activeAlerts: number;
  congestionIndex: number;
  incidentsToday: number;
}

export interface HourlyTraffic {
  hour: string;
  vehicles: number;
  avgSpeed: number;
}

export interface CameraTraffic {
  cameraId: string;
  cameraName: string;
  vehicleCount: number;
  avgSpeed: number;
  congestionLevel: TrafficLevel;
}

export type CameraStatus = 'online' | 'warning' | 'offline';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 'BLACKLIST_VEHICLE' | 'ROUTE_ANOMALY' | 'TRAFFIC_SURGE' | 'CAMERA_OFFLINE';
export type TrafficLevel = 'low' | 'moderate' | 'high' | 'congested';

export interface Camera {
  id: string;
  cameraCode: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: CameraStatus;
  trafficLevel: TrafficLevel;
  vehiclesDetected: number;
  detectionCount: number;
  fps: number | null;
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
  speed: number | null;
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
  detectionCount: number;
  avgSpeed: number | null;
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
  isSimulation?: boolean;
}

export interface TrafficStats {
  totalVehiclesToday: number;
  detectionCount: number;
  avgSpeed: number | null;
  activeCameras: number;
  activeAlerts: number;
  congestionIndex: number;
  incidentsToday: number;
  trendPercentage?: number;
  peakZone?: {
    name: string;
    ratePerHour: number;
  };
  anprAccuracy?: number;
  latencyMs?: number;
  frameSyncPercentage?: number;
}

export interface HourlyTraffic {
  hour: string;
  vehicles: number;
  uniqueVehicleCount: number;
  detectionCount: number;
  avgSpeed: number | null;
}

export interface CameraTraffic {
  cameraId: string;
  cameraName: string;
  vehicleCount: number;
  detectionCount: number;
  avgSpeed: number | null;
  congestionLevel: TrafficLevel;
}

export interface BlacklistedVehicle {
  id: string;
  plateNumber: string;
  reason: string;
  severity: AlertSeverity;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface NextCameraPrediction {
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  zone?: string;
  road?: string;
  probability: number;
  etaMinutes?: number;
  confidence?: 'HIGH' | 'MODERATE' | 'LOW';
  basis?: 'VEHICLE_AND_NETWORK_TRANSITIONS' | 'NETWORK_TRANSITIONS' | 'NEAREST_CAMERA_FALLBACK';
  alternativeCameras?: Array<{ cameraCode: string; cameraName: string; probability: number }>;
}

export interface BlacklistIntelligenceVehicle {
  id: string;
  plateNumber: string;
  reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'INACTIVE';
  flaggedAt: string;
  vehicleIntelligence: {
    vehicleType: string;
    color: string;
    firstSeen: string;
    lastSeen: string;
    totalDetections: number;
    camerasVisited: number;
    averageSpeed: number;
  };
  lastSighting: {
    cameraId: string;
    cameraCode: string;
    cameraName: string;
    zone: string;
    road: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    direction: string;
  } | null;
  nextProbableCamera: NextCameraPrediction | null;
}

export interface NetworkCorridor {
  origin: { id: string; name: string; code: string };
  destination: { id: string; name: string; code: string };
  volume: number;
  uniqueVehicleCount: number;
  averageTravelSeconds: number | null;
  averageSpeed: number | null;
}

export interface NetworkAnalytics {
  corridors: NetworkCorridor[];
  summary: { corridorCount: number; averageTravelSeconds: number | null; peakVolume: number; transitionCount: number; uniqueVehicleCount: number };
}

export interface SystemNode {
  id: string;
  cameraCode: string;
  name: string;
  zone: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  responseMs: number | null;
  lastUpdated: string;
}

export interface SystemHealth {
  summary: { total: number; online: number; warning: number; offline: number; activeAlerts: number };
  nodes: SystemNode[];
}

export interface CitizenSubmission {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: 'HIGH' | 'LOW';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  submitterName: string;
  submitterContact?: string;
  timestamp: string;
  status: 'PENDING' | 'REVIEWED' | 'DISPATCHED' | 'DISMISSED';
  vehiclePlate?: string;
}

export interface VehicleMovementIntelligence {
  summary: {
    vehicle_id: string;
    plate: string;
    vehicle_type: string;
    total_detections: number;
    avg_segment_speed_kmh: number;
    max_segment_speed_kmh: number;
    total_dwell_hours: number;
    anomalous_events_detected: number;
    frequent_hotspots: number;
    dwell_threshold_used_mins: number;
  };
  recent_route: Array<{
    timestamp: string;
    camera_id: string;
    latitude: number;
    longitude: number;
    derived_speed_kmh: number;
  }>;
}

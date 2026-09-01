const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');

const VEHICLE_SPEED_RANGES = {
  AUTO: [22, 34],
  BUS: [28, 42],
  CAR: [35, 58],
  MOTORCYCLE: [32, 54],
  SCOOTER: [25, 40],
  TAXI: [32, 52],
  TRUCK: [24, 38],
  VAN: [30, 46],
};

function getSimulationSpeed(vehicle) {
  const [minimum, maximum] = VEHICLE_SPEED_RANGES[vehicle.vehicleType] || VEHICLE_SPEED_RANGES.CAR;
  const baseline = Number.isFinite(vehicle.speed) && vehicle.speed > 0
    ? Math.min(maximum, Math.max(minimum, vehicle.speed))
    : minimum + ((maximum - minimum) / 2);
  return Math.round((baseline + ((Math.random() - 0.5) * 8)) * 10) / 10;
}

function calculateDistanceMeters(longitudeA, latitudeA, longitudeB, latitudeB) {
  const earthRadius = 6371000;
  const latitudeDelta = (latitudeB - latitudeA) * (Math.PI / 180);
  const longitudeDelta = (longitudeB - longitudeA) * (Math.PI / 180);
  const meanLatitude = ((latitudeA + latitudeB) / 2) * (Math.PI / 180);
  const eastWest = longitudeDelta * Math.cos(meanLatitude);
  return earthRadius * Math.hypot(latitudeDelta, eastWest);
}

function sampleVehicles(vehicles, maximumVehicles) {
  const blacklisted = vehicles.filter((vehicle) => vehicle.status === 'BLACKLISTED');
  const active = vehicles.filter((vehicle) => vehicle.status !== 'BLACKLISTED');
  const remainingSlots = Math.max(0, maximumVehicles - blacklisted.length);
  const shuffledActive = [...active].sort(() => Math.random() - 0.5);
  return [...blacklisted, ...shuffledActive.slice(0, remainingSlots)];
}

class SimulationEngine {
  constructor() {
    this.running = false;
    this.speed = 1;
    this.time = new Date();
    this.vehicles = [];
    this.cameras = [];
    this.roads = [];
    this.recentDetections = [];
    this.timer = null;
    this.tickInProgress = false;
    this.tickRateMs = 1000;
    this.detectionRadiusMeters = 150;
    this.maximumVehicles = Math.min(Math.max(Number(process.env.SIMULATION_VEHICLE_COUNT) || 250, 25), 1000);
    this.generatedDetectionCount = 0;
    this.lastPersistenceError = null;
    this.liveCameraCounts = new Map();
    this.liveAlerts = [];
    this.nextEventId = 1;
    this.congestionCheckInProgress = false;

    this.graph = new Map(); // Node -> Array of Edges
    this.nodesList = []; // Helper for picking random nodes
    this.lastHealthCheck = new Date(this.time);
    this.routeCache = new Map();
    this.lastCongestionCheck = new Map(); // cameraId -> timestamp
  }

  async init() {
    this.roads = await prisma.road.findMany();
    this.cameras = await prisma.camera.findMany();
    const dbVehicles = await prisma.vehicle.findMany({ where: { status: { in: ['ACTIVE', 'BLACKLISTED'] } } });

    this.buildGraph();
    if (this.nodesList.length === 0) {
      console.warn('Simulation cannot start because no routable road geometry is available. Running in read-only mode.');
      return;
    }

    // Map DB vehicles to simulation state
    this.vehicles = sampleVehicles(dbVehicles, this.maximumVehicles).map(v => {
      const startNode = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
      const destNode = this.selectDestination(startNode);
      const route = this.calculateRoute(startNode, destNode);

      const parts = startNode.split(',').map(Number);

      const hour = new Date().getHours();
      let wakeProbability = 0.8;
      if (hour >= 23 || hour <= 4) wakeProbability = 0.05;
      else if (hour >= 5 && hour <= 7) wakeProbability = 0.3;

      let initialState = 'MOVING';
      let initialRestUntil = null;

      // Start most vehicles moving immediately
      if (Math.random() > wakeProbability) {
        initialState = 'RESTING';
        const maxRestMins = 8 * 60;
        const restMins = Math.random() * maxRestMins;
        initialRestUntil = new Date(Date.now() + restMins * 60000);
      } else {
        initialState = 'MOVING';
        initialRestUntil = null;
      }

      return {
        id: v.id,
        plateNumber: v.plateNumber,
        type: v.vehicleType || 'CAR',
        speed: getSimulationSpeed(v),
        status: v.status, // Needed for Blacklist checks

        state: initialState,
        restUntil: initialRestUntil,

        currentNode: startNode,
        destinationNode: destNode,
        currentRoute: route,
        routeIndex: 0,
        distanceTravelled: 0,
        coords: parts,
        currentRoadId: route.length > 0 ? route[0].roadId : null,

        recentNodes: [startNode],
        activeCameras: new Set(),
        lastCameraId: null,
        lastCameraTimestamp: null
      };
    });
  }

  buildGraph() {
    this.graph.clear();
    this.nodesList = [];
    const nodeCounts = new Map();

    // First pass: Count coordinate occurrences to find intersections
    for (const road of this.roads) {
      if (!road.geometry || !road.geometry.coordinates) continue;
      const coords = road.geometry.coordinates;
      // Count unique coordinates in THIS road (prevent a winding road from counting its own coordinates as intersections if it crosses itself, though usually rare in basic OSM)
      const uniqueInRoad = new Set();
      coords.forEach(c => uniqueInRoad.add(c.join(',')));
      uniqueInRoad.forEach(key => {
        nodeCounts.set(key, (nodeCounts.get(key) || 0) + 1);
      });
    }

    // Second pass: Form edges between intersections/endpoints
    for (const road of this.roads) {
      if (!road.geometry || !road.geometry.coordinates) continue;
      const coords = road.geometry.coordinates;

      let startIdx = 0;
      let startKey = coords[0].join(',');

      for (let i = 1; i < coords.length; i++) {
        const key = coords[i].join(',');
        const isEndpoint = (i === coords.length - 1);
        const isIntersection = nodeCounts.get(key) > 1;

        if (isEndpoint || isIntersection) {
          const segmentCoords = coords.slice(startIdx, i + 1);

          // turf needs at least 2 coordinates
          if (segmentCoords.length >= 2) {
            const line = turf.lineString(segmentCoords);
            const dist = turf.length(line, { units: 'meters' });

            if (!this.graph.has(startKey)) this.graph.set(startKey, []);
            if (!this.graph.has(key)) this.graph.set(key, []);

            // Add forward edge
            this.graph.get(startKey).push({
              target: key,
              distance: dist,
              geometry: segmentCoords,
              roadId: road.id
            });

            // Add reverse edge
            this.graph.get(key).push({
              target: startKey,
              distance: dist,
              geometry: [...segmentCoords].reverse(),
              roadId: road.id
            });
          }

          startIdx = i;
          startKey = key;
        }
      }
    }

    this.nodesList = Array.from(this.graph.keys());
    console.log(`Graph built: ${this.nodesList.length} nodes, ${Array.from(this.graph.values()).reduce((a, b) => a + b.length, 0)} edges.`);
  }

  selectDestination(startNode) {
    if (this.nodesList.length === 0) return startNode;
    const startParts = startNode.split(',').map(Number);
    const startPt = turf.point(startParts);

    for (let i = 0; i < 20; i++) {
      const candidate = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
      const candParts = candidate.split(',').map(Number);
      const candPt = turf.point(candParts);

      if (turf.distance(startPt, candPt, { units: 'meters' }) >= 500) {
        return candidate;
      }
    }
    return this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
  }

  calculateRoute(startNode, endNode, recentNodes = []) {
    const cacheKey = `${startNode}->${endNode}`;
    if (recentNodes.length === 0 && this.routeCache.has(cacheKey)) {
      return [...this.routeCache.get(cacheKey)];
    }

    // Basic Dijkstra with penalty for recent nodes
    const dist = new Map();
    const prev = new Map();
    const unvisited = new Set(this.nodesList);

    // Initialize
    for (const node of this.nodesList) {
      dist.set(node, Infinity);
    }
    dist.set(startNode, 0);

    const recentSet = new Set(recentNodes);

    // Not perfectly optimized priority queue, but fast enough for 1300 nodes
    while (unvisited.size > 0) {
      let u = null;
      let minDist = Infinity;

      // Find min node
      for (const node of unvisited) {
        if (dist.get(node) < minDist) {
          minDist = dist.get(node);
          u = node;
        }
      }

      if (u === null || u === endNode) break;
      unvisited.delete(u);

      const neighbors = this.graph.get(u) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.target)) continue;

        let cost = edge.distance;
        // Add massive penalty to absolutely avoid U-turns and short loops
        if (recentSet.has(edge.target)) {
          cost += 1000000;
        }

        const alt = dist.get(u) + cost;
        if (alt < dist.get(edge.target)) {
          dist.set(edge.target, alt);
          prev.set(edge.target, { node: u, edge: edge });
        }
      }
    }

    // Reconstruct path
    const route = [];
    let curr = endNode;
    while (prev.has(curr)) {
      const step = prev.get(curr);
      route.unshift(step.edge);
      curr = step.node;
    }

    if (recentNodes.length === 0 && route.length > 0) {
      this.routeCache.set(cacheKey, [...route]);
      if (this.routeCache.size > 5000) this.routeCache.delete(this.routeCache.keys().next().value);
    }

    return route;
  }

  start() {
    if (this.running) return;
    if (!this.vehicles.length || !this.cameras.length || !this.nodesList.length) {
      throw new Error('Simulation is not ready: roads, cameras, and vehicle profiles are required.');
    }
    this.running = true;
    this.lastTickTime = Date.now();
    this.timer = setInterval(() => {
      if (this.tickInProgress) return;
      this.tickInProgress = true;
      this.tick()
        .catch((error) => {
          this.lastPersistenceError = error.message;
          console.error('Simulation tick failed:', error);
        })
        .finally(() => {
          this.tickInProgress = false;
        });
    }, this.tickRateMs);
  }

  pause() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async reset() {
    this.pause();
    this.time = new Date();
    this.lastHealthCheck = new Date(this.time);
    this.recentDetections = [];
    this.generatedDetectionCount = 0;
    this.lastPersistenceError = null;
    this.liveCameraCounts.clear();
    this.liveAlerts = [];
    await this.init();
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  async tick() {
    const now = Date.now();
    const realDeltaSec = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // Enforce true real-time sync, ignoring artificial speed multipliers
    const simDeltaSec = realDeltaSec;
    this.time = new Date(now);

    const liveDetections = [];

    // Move vehicles
    for (let v of this.vehicles) {
      if (v.state === 'RESTING') {
        if (v.restUntil && this.time < v.restUntil) continue;

        // Reached end of rest duration. Check time-of-day probability to wake up.
        const hour = this.time.getHours();
        let wakeProbability = 0.8; // Default day time
        if (hour >= 23 || hour <= 4) wakeProbability = 0.05; // Very low at night
        else if (hour >= 5 && hour <= 7) wakeProbability = 0.3; // Early morning

        if (Math.random() > wakeProbability) {
          // Sleep for another 30 mins if probability check fails
          v.restUntil = new Date(this.time.getTime() + 30 * 60000);
          continue;
        }

        v.state = 'MOVING';
        v.restUntil = null;
      }

      if (!v.currentRoute || v.routeIndex >= v.currentRoute.length) {
        // Reached destination or has no valid route

        const minRestMins = 15;
        const maxRestMins = 8 * 60; // Up to 8 hours resting at destination
        const restMins = minRestMins + Math.random() * (maxRestMins - minRestMins);

        v.state = 'RESTING';
        v.restUntil = new Date(this.time.getTime() + restMins * 60000);

        v.destinationNode = this.selectDestination(v.currentNode);
        v.currentRoute = this.calculateRoute(v.currentNode, v.destinationNode, v.recentNodes);
        v.routeIndex = 0;
        v.distanceTravelled = 0;

        // If still no route (e.g. disconnected component trap), just pick random neighbor and force step
        if (v.currentRoute.length === 0) {
          const neighbors = this.graph.get(v.currentNode);
          if (neighbors && neighbors.length > 0) {
            v.currentRoute = [neighbors[Math.floor(Math.random() * neighbors.length)]];
            v.destinationNode = v.currentRoute[0].target;
          } else {
            // Truly stuck, teleport but rest first
            v.currentNode = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
            v.coords = v.currentNode.split(',').map(Number);
          }
        }
        // Skip moving this tick while it enters RESTING state
        continue;
      }

      const speedMs = v.speed * (1000 / 3600);
      let remainingDistance = speedMs * simDeltaSec;

      const previousCoords = [...v.coords];

      // A vehicle can cross more than one short road segment in a tick. Carry
      // the remaining distance forward so simulated time and position agree.
      while (remainingDistance > 0 && v.currentRoute && v.routeIndex < v.currentRoute.length) {
        const edge = v.currentRoute[v.routeIndex];
        v.currentRoadId = edge.roadId;
        const remainingOnEdge = Math.max(0, edge.distance - v.distanceTravelled);

        if (remainingDistance >= remainingOnEdge) {
          remainingDistance -= remainingOnEdge;
          v.currentNode = edge.target;
          v.recentNodes.push(v.currentNode);
          if (v.recentNodes.length > 5) v.recentNodes.shift();
          v.routeIndex++;
          v.distanceTravelled = 0;
          v.coords = edge.geometry[edge.geometry.length - 1];
          continue;
        }

        v.distanceTravelled += remainingDistance;
        const line = turf.lineString(edge.geometry);
        v.coords = turf.along(line, v.distanceTravelled, { units: 'meters' }).geometry.coordinates;
        remainingDistance = 0;
      }

      // Check proximity to cameras using a LineString to represent the exact movement path this tick
      // to ensure fast vehicles don't "jump" over the camera bounding box between frames.
      const movementLine = (previousCoords[0] !== v.coords[0] || previousCoords[1] !== v.coords[1])
        ? turf.lineString([previousCoords, v.coords])
        : turf.point(v.coords);

      for (const cam of this.cameras) {
        if (cam.status !== 'ONLINE') continue;

        const camPoint = turf.point([cam.longitude, cam.latitude]);
        
        let dist;
        if (movementLine.geometry.type === 'LineString') {
           const nearest = turf.nearestPointOnLine(movementLine, camPoint);
           dist = turf.distance(camPoint, nearest, { units: 'meters' });
        } else {
           dist = turf.distance(camPoint, movementLine, { units: 'meters' });
        }

        if (dist <= this.detectionRadiusMeters) {
          if (!v.activeCameras.has(cam.id)) {
            v.activeCameras.add(cam.id);

            const detection = {
              id: `simulation-${this.nextEventId++}`,
              vehicleId: v.id,
              cameraId: cam.id,
              plateText: v.plateNumber,
              timestamp: new Date(this.time),
              source: 'SIMULATION',
              speed: v.speed,
              vehicleConfidence: 0.95 + (Math.random() * 0.04),
              ocrConfidence: 0.90 + (Math.random() * 0.09),
              lane: Math.floor(Math.random() * 3) + 1,
              direction: cam.direction || (Math.random() > 0.5 ? 'NORTHBOUND' : 'SOUTHBOUND'),
              latitude: v.coords[1],
              longitude: v.coords[0]
            };
            liveDetections.push(detection);
            v.lastCameraId = cam.id;
            v.lastCameraTimestamp = new Date(this.time);
          }
        } else {
          if (v.activeCameras.has(cam.id)) {
            v.activeCameras.delete(cam.id);
          }
        }
      }
    }

    if (liveDetections.length > 0) {
      this.recentDetections = [...liveDetections.reverse(), ...this.recentDetections].slice(0, 100);
      this.generatedDetectionCount += liveDetections.length;

      // Asynchronously persist realistic real-time detections to the database
      prisma.detection.createMany({
        data: liveDetections.map(d => ({
          vehicleId: d.vehicleId,
          cameraId: d.cameraId,
          plateText: d.plateText,
          timestamp: d.timestamp,
          ocrConfidence: d.ocrConfidence,
          vehicleConfidence: d.vehicleConfidence,
          lane: d.lane,
          direction: d.direction,
          latitude: d.latitude,
          longitude: d.longitude,
          source: d.source
        })),
        skipDuplicates: true
      }).catch(err => console.error('Failed to persist simulated detections:', err));

      // Also update vehicle lastSeen
      const vehicleIds = liveDetections.map(d => d.vehicleId);
      prisma.vehicle.updateMany({
        where: { id: { in: vehicleIds } },
        data: { lastSeen: new Date(this.time) }
      }).catch(err => console.error('Failed to update vehicle lastSeen:', err));

      // Generate Blacklist alerts
      const blacklistedVehicles = this.vehicles.filter(v => v.status === 'BLACKLISTED' && liveDetections.some(d => d.vehicleId === v.id));
      for (const bv of blacklistedVehicles) {
        const detection = liveDetections.find(d => d.vehicleId === bv.id);
        if (!detection) continue;
        prisma.alert.findFirst({
          where: { vehicleId: bv.id, type: 'BLACKLIST_MATCH', status: 'ACTIVE' }
        }).then(existingAlert => {
          if (!existingAlert) {
            prisma.alert.create({
              data: {
                type: 'BLACKLIST_MATCH',
                severity: 'CRITICAL',
                vehicleId: bv.id,
                cameraId: detection.cameraId,
                message: `Blacklisted vehicle ${bv.plateNumber} detected on camera.`,
                status: 'ACTIVE',
                createdAt: detection.timestamp
              }
            }).catch(() => { });
          } else {
            // Bump the alert to the top if it already exists
            prisma.alert.update({
              where: { id: existingAlert.id },
              data: {
                createdAt: detection.timestamp,
                cameraId: detection.cameraId
              }
            }).catch(() => { });
          }
        }).catch(() => { });
      }
    }

    this.liveCameraCounts = new Map();
    for (const vehicle of this.vehicles) {
      if (vehicle.state === 'RESTING') continue; // Don't count resting vehicles as active traffic
      for (const cameraId of vehicle.activeCameras) {
        this.liveCameraCounts.set(cameraId, (this.liveCameraCounts.get(cameraId) || 0) + 1);
      }
    }

    // Process Congestion Alerts using the single source of truth in traffic.service.js
    // We throttle this to check at most one camera per tick, and each camera at most once every 15s to avoid DB spam.
    const trafficService = require('../traffic/traffic.service');
    
    // Pick one camera to check this tick based on simulation time
    const tickSecond = Math.floor(this.time.getTime() / 1000);
    const cameraIndex = tickSecond % this.cameras.length;
    
    if (this.cameras.length > 0 && !this.congestionCheckInProgress) {
      const cameraToCheck = this.cameras[cameraIndex];
      const lastCheck = this.lastCongestionCheck.get(cameraToCheck.id) || 0;
      
      if (this.time.getTime() - lastCheck >= 15000) {
        this.lastCongestionCheck.set(cameraToCheck.id, this.time.getTime());
        this.congestionCheckInProgress = true;
        // Run asynchronously so we don't block the tick
        trafficService.evaluateCongestionAlert(cameraToCheck.id, this.time).catch((err) => {
          console.error(`Congestion check failed for ${cameraToCheck.id}:`, err.message);
        }).finally(() => {
          this.congestionCheckInProgress = false;
        });
      }
    }

    this.liveAlerts = []; // Deprecated in favor of DB alerts
  }

  getLiveCameraCounts() {
    return new Map(this.liveCameraCounts);
  }

  getLiveAlerts() {
    return [...this.liveAlerts];
  }

  getState() {
    return {
      simulationTime: this.time,
      speed: this.speed,
      running: this.running,
      stats: {
        vehicles: this.vehicles.length,
        cameras: this.cameras.length,
        recentDetections: this.recentDetections.length,
        generatedDetections: this.generatedDetectionCount,
      },
      lastPersistenceError: this.lastPersistenceError,
      vehicles: this.vehicles.map(v => ({
        id: v.id,
        plateNumber: v.plateNumber,
        type: v.type,
        speed: v.speed,
        longitude: v.coords[0],
        latitude: v.coords[1],
        roadId: v.currentRoadId,
        currentNode: v.currentNode,
        destinationNode: v.destinationNode,
        routeLength: v.currentRoute ? v.currentRoute.length : 0,
        routeIndex: v.routeIndex
      })),
      recentDetections: this.recentDetections.slice(0, 20)
    };
  }
}

const engine = new SimulationEngine();
global.simulationEngine = engine;
module.exports = engine;

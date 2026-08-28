const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');
const { recordDetection } = require('../detection/detection.service');
const { evaluateCongestionAlert } = require('../traffic/traffic.service');
const { pruneStorage } = require('../system/storage.service');

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
    this.speed = 2;
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
    this.persistenceBatchSize = 25;
    this.persistedDetectionCount = 0;
    this.lastPersistenceError = null;
    
    this.graph = new Map(); // Node -> Array of Edges
    this.nodesList = []; // Helper for picking random nodes
    this.lastHealthCheck = new Date(this.time);
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
      
      return {
        id: v.id,
        plateNumber: v.plateNumber,
        type: v.vehicleType || 'CAR',
        speed: getSimulationSpeed(v),
        
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
    console.log(`Graph built: ${this.nodesList.length} nodes, ${Array.from(this.graph.values()).reduce((a,b)=>a+b.length,0)} edges.`);
  }
  
  selectDestination(startNode) {
      if (this.nodesList.length === 0) return startNode;
      const startParts = startNode.split(',').map(Number);
      const startPt = turf.point(startParts);
      
      for (let i=0; i<20; i++) {
          const candidate = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
          const candParts = candidate.split(',').map(Number);
          const candPt = turf.point(candParts);
          
          if (turf.distance(startPt, candPt, {units: 'meters'}) >= 500) {
              return candidate;
          }
      }
      return this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
  }
  
  calculateRoute(startNode, endNode, recentNodes = []) {
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
      
      return route;
  }

  start() {
    if (this.running) return;
    if (!this.vehicles.length || !this.cameras.length || !this.nodesList.length) {
      console.warn('Simulation is not ready. Skipping simulation start. Backend will run in read-only mode.');
      return;
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
    this.persistedDetectionCount = 0;
    this.lastPersistenceError = null;
    await this.init(); 
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  async tick() {
    const now = Date.now();
    const realDeltaSec = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const simDeltaSec = realDeltaSec * this.speed;
    this.time = new Date(this.time.getTime() + simDeltaSec * 1000);

    const detectionsToSave = [];
    const transitionsToSave = [];

    // Move vehicles
    for (let v of this.vehicles) {
        if (!v.currentRoute || v.routeIndex >= v.currentRoute.length) {
            // Reached destination or has no valid route
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
                    // Truly stuck, teleport
                    v.currentNode = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
                    v.coords = v.currentNode.split(',').map(Number);
                }
            }
            continue;
        }

        const edge = v.currentRoute[v.routeIndex];
        const speedMs = v.speed * (1000 / 3600);
        const distanceMoved = speedMs * simDeltaSec;
        v.distanceTravelled += distanceMoved;
        
        v.currentRoadId = edge.roadId;

        if (v.distanceTravelled >= edge.distance) {
            // Reached node
            v.currentNode = edge.target;
            v.recentNodes.push(v.currentNode);
            if (v.recentNodes.length > 5) v.recentNodes.shift();
            
            v.routeIndex++;
            v.distanceTravelled = 0; // Carry over distance dropped for simplicity
            v.coords = edge.geometry[edge.geometry.length - 1];
        } else {
            // Move along edge geometry
            const line = turf.lineString(edge.geometry);
            const point = turf.along(line, v.distanceTravelled, { units: 'meters' });
            v.coords = point.geometry.coordinates;
        }

        // Check proximity to cameras
        for (const cam of this.cameras) {
            if (cam.status !== 'ONLINE') continue;
            
            const dist = calculateDistanceMeters(cam.longitude, cam.latitude, v.coords[0], v.coords[1]);

            if (dist <= this.detectionRadiusMeters) {
                if (!v.activeCameras.has(cam.id)) {
                    v.activeCameras.add(cam.id);
                    
                    console.log(`[DETECTION] Vehicle: ${v.id} Plate: ${v.plateNumber} Camera: ${cam.cameraCode || cam.id} Distance: ${dist.toFixed(1)}m Time: ${this.time.toISOString()} Source: SIMULATION`);
                    
                    const detection = {
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
                    detectionsToSave.push({ data: detection, vehicle: v, cameraId: cam.id });

                    // Generate Camera Transition
                    if (v.lastCameraId && v.lastCameraId !== cam.id) {
                        const travelTimeSeconds = Math.round((this.time.getTime() - v.lastCameraTimestamp.getTime()) / 1000);
                        const lastCam = this.cameras.find(c => c.id === v.lastCameraId);
                        let distanceMeters = null;
                        let averageSpeed = null;
                        if (lastCam) {
                            distanceMeters = calculateDistanceMeters(lastCam.longitude, lastCam.latitude, cam.longitude, cam.latitude);
                            if (travelTimeSeconds > 0) {
                                averageSpeed = (distanceMeters / travelTimeSeconds) * 3.6; // km/h
                            }
                        }

                        if (travelTimeSeconds > 0 && distanceMeters > 0) {
                            transitionsToSave.push({
                                sourceCameraId: v.lastCameraId,
                                destinationCameraId: cam.id,
                                vehicleId: v.id,
                                timestamp: new Date(this.time),
                                travelTimeSeconds,
                                distanceMeters,
                                averageSpeed
                            });
                        }
                    }
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

    if (detectionsToSave.length > 0) {
      const results = [];
      for (let index = 0; index < detectionsToSave.length; index += this.persistenceBatchSize) {
        const batch = detectionsToSave.slice(index, index + this.persistenceBatchSize);
        const batchResults = await Promise.allSettled(batch.map(({ data }) => recordDetection(data, { evaluateCongestion: false })));
        results.push(...batchResults);
      }
      const persisted = [];
      let hasPersistenceFailure = false;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          persisted.push(result.value.detection);
          return;
        }
        const failedDetection = detectionsToSave[index];
        failedDetection.vehicle.activeCameras.delete(failedDetection.cameraId);
        hasPersistenceFailure = true;
        this.lastPersistenceError = result.reason instanceof Error ? result.reason.message : 'Unable to save simulation detection';
        console.error('Failed to save simulation detection:', result.reason);
      });
      if (persisted.length > 0) {
        this.recentDetections = [...persisted.reverse(), ...this.recentDetections].slice(0, 100);
        this.persistedDetectionCount += persisted.length;
        if (!hasPersistenceFailure) this.lastPersistenceError = null;
        const affectedCameraIds = [...new Set(persisted.map((detection) => detection.cameraId))];
        const congestionResults = await Promise.allSettled(
          affectedCameraIds.map((cameraId) => evaluateCongestionAlert(cameraId, this.time)),
        );
        congestionResults.forEach((result) => {
          if (result.status === 'rejected') console.error('Failed to evaluate simulation congestion:', result.reason);
        });
      }
    }

    if (transitionsToSave.length > 0) {
      try {
        await prisma.cameraTransition.createMany({ data: transitionsToSave });
      } catch (err) {
        console.error('Failed to save camera transitions:', err);
      }
    }

    // Health Checks (Every 60 simulation seconds)
    if (this.time.getTime() - this.lastHealthCheck.getTime() >= 60000) {
        this.lastHealthCheck = new Date(this.time);
        if (this.cameras.length > 0) {
            const healthRecords = this.cameras.map(cam => ({
                cameraId: cam.id,
                status: cam.status,
                recordedAt: new Date(this.time),
                responseMs: cam.status === 'ONLINE' ? Math.floor(Math.random() * 100) + 20 : null,
                errorMessage: cam.status === 'ONLINE' ? null : 'Connection timeout'
            }));
            try {
                await prisma.cameraHealth.createMany({ data: healthRecords });
            } catch (err) {
                console.error('Failed to save camera health:', err);
            }
        }
    }

    // Storage Quota Guard (Every 15 simulation minutes)
    if (!this.lastStoragePrune || (this.time.getTime() - this.lastStoragePrune.getTime() >= 15 * 60 * 1000)) {
      this.lastStoragePrune = new Date(this.time);
      pruneStorage().catch(err => console.error('Background storage prune error:', err.message));
    }
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
        persistedDetections: this.persistedDetectionCount,
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

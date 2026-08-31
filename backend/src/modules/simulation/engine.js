const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');
const { processDetectionForBlacklist } = require('../blacklist/blacklist.service');

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
    this.detectionRadiusMeters = 45;
    this.maximumVehicles = Math.min(Math.max(Number(process.env.SIMULATION_VEHICLE_COUNT) || 250, 25), 1000);
    this.generatedDetectionCount = 0;
    this.lastPersistenceError = null;
    this.liveCameraCounts = new Map();
    this.liveAlerts = [];
    this.nextEventId = 1;
    
    this.graph = new Map(); // Node -> Array of Edges
    this.nodesList = []; // Helper for picking random nodes
    this.lastHealthCheck = new Date(this.time);
    this.routeCache = new Map();
  }

  async init() {
    this.roads = await prisma.road.findMany();
    this.cameras = await prisma.camera.findMany();
    const dbVehicles = await prisma.vehicle.findMany({
      where: { status: { in: ['ACTIVE', 'BLACKLISTED'] } },
    });

    this.buildGraph();
    if (this.nodesList.length === 0) {
      console.warn('Simulation cannot start because no routable road geometry is available. Running in read-only mode.');
      return;
    }

    const vehicleIds = dbVehicles.map((vehicle) => vehicle.id);
    const latestDetections = vehicleIds.length
      ? await prisma.detection.findMany({
          where: { vehicleId: { in: vehicleIds } },
          orderBy: { timestamp: 'desc' },
          distinct: ['vehicleId'],
          select: { vehicleId: true, latitude: true, longitude: true, timestamp: true },
        })
      : [];

    const latestByVehicle = new Map(latestDetections.map((detection) => [detection.vehicleId, detection]));

    this.vehicles = sampleVehicles(dbVehicles, this.maximumVehicles).map((dbVehicle) => {
      const latest = latestByVehicle.get(dbVehicle.id);
      const detectedNode = latest && Number.isFinite(latest.longitude) && Number.isFinite(latest.latitude)
        ? this.findNearestNode([latest.longitude, latest.latitude], 250)
        : null;
      const startNode = detectedNode || this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
      const destination = this.findDestinationAndRoute(startNode);
      const parts = startNode.split(',').map(Number);

      return {
        id: dbVehicle.id,
        plateNumber: dbVehicle.plateNumber,
        type: dbVehicle.vehicleType || 'CAR',
        speed: getSimulationSpeed(dbVehicle),
        status: dbVehicle.status,
        state: 'RESTING',
        restUntil: new Date(Date.now() + Math.random() * 60_000),
        currentNode: startNode,
        destinationNode: destination?.node || startNode,
        currentRoute: destination?.route || [],
        routeIndex: 0,
        distanceTravelled: 0,
        coords: parts,
        currentRoadId: destination?.route?.[0]?.roadId || null,
        recentNodes: [startNode],
        activeCameras: new Set(),
        lastCameraId: null,
        lastCameraTimestamp: latest?.timestamp || null,
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
  
  findNearestNode(coords, maxDistanceMeters = Infinity) {
    if (!Array.isArray(coords) || coords.length < 2) return null;
    let bestNode = null;
    let bestDistance = Infinity;
    const point = turf.point(coords);

    for (const node of this.nodesList) {
      const distance = turf.distance(point, turf.point(node.split(',').map(Number)), { units: 'meters' });
      if (distance < bestDistance) {
        bestDistance = distance;
        bestNode = node;
      }
    }
    return bestDistance <= maxDistanceMeters ? bestNode : null;
  }

  findDestinationAndRoute(startNode) {
    if (!startNode || !this.graph.has(startNode)) return null;

    for (let attempt = 0; attempt < 25; attempt++) {
      const candidate = this.selectDestination(startNode);
      if (!candidate) continue;
      const route = this.calculateRoute(startNode, candidate, []);
      if (route.length) return { node: candidate, route };
    }

    const neighbors = this.graph.get(startNode) || [];
    if (!neighbors.length) return null;
    const edge = neighbors[Math.floor(Math.random() * neighbors.length)];
    return { node: edge.target, route: [edge] };
  }

  selectDestination(startNode) {
    if (!this.nodesList.length || !this.graph.has(startNode)) return null;
    const start = turf.point(startNode.split(',').map(Number));
    const candidates = this.nodesList.filter((node) => {
      if (node === startNode) return false;
      const distance = turf.distance(start, turf.point(node.split(',').map(Number)), { units: 'meters' });
      return distance >= 500;
    });
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
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
    const simSpeed = Math.min(50, Math.max(0.1, Number(this.speed) || 1));
    const simDeltaSec = realDeltaSec * simSpeed;
    this.time = new Date(this.time.getTime() + simDeltaSec * 1000);

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

            const destination = this.findDestinationAndRoute(v.currentNode);
            if (destination) {
                v.destinationNode = destination.node;
                v.currentRoute = destination.route;
                v.routeIndex = 0;
                v.distanceTravelled = 0;
                v.currentRoadId = destination.route[0]?.roadId || null;
                v.activeCameras.clear();
            }
            // No route: remain at the current node. Never teleport.
            continue;
        }

        const speedMs = v.speed * (1000 / 3600);
        let remainingDistance = speedMs * simDeltaSec;

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

        // Check proximity to cameras
        for (const cam of this.cameras) {
            if (cam.status !== 'ONLINE') continue;
            
            const dist = calculateDistanceMeters(cam.longitude, cam.latitude, v.coords[0], v.coords[1]);

            if (dist <= this.detectionRadiusMeters) {
                if (!v.activeCameras.has(cam.id)) {
                    v.activeCameras.add(cam.id);
                    
                    // Add a random millisecond jitter (0-999ms) so detections in the same tick don't share the exact same timestamp
                    const jitterMs = Math.floor(Math.random() * 1000);
                    const detection = {
                        id: `simulation-${this.nextEventId++}`,
                        vehicleId: v.id,
                        cameraId: cam.id,
                        plateText: v.plateNumber,
                        timestamp: new Date(this.time.getTime() - jitterMs),
                        source: 'SIMULATION',
                        speed: v.speed,
                        vehicleConfidence: 0.95 + (Math.random() * 0.04),
                        ocrConfidence: 0.90 + (Math.random() * 0.09),
                        lane: Math.floor(Math.random() * 3) + 1,
                        direction: cam.direction || 'UNKNOWN',
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
      this.recentDetections = [...liveDetections].reverse().concat(this.recentDetections).slice(0, 100);
      this.generatedDetectionCount += liveDetections.length;

      try {
        const savedDetections = [];
        for (const detection of liveDetections) {
          const saved = await prisma.detection.create({
            data: {
              vehicleId: detection.vehicleId,
              cameraId: detection.cameraId,
              plateText: detection.plateText,
              timestamp: detection.timestamp,
              ocrConfidence: detection.ocrConfidence,
              vehicleConfidence: detection.vehicleConfidence,
              lane: detection.lane,
              direction: detection.direction,
              latitude: detection.latitude,
              longitude: detection.longitude,
              source: detection.source,
            },
          });
          savedDetections.push(saved);
        }

        await Promise.all(savedDetections.map((detection) =>
          prisma.vehicle.update({
            where: { id: detection.vehicleId },
            data: { lastSeen: detection.timestamp },
          })
        ));

        for (const detection of savedDetections) {
          const vehicle = this.vehicles.find((item) => item.id === detection.vehicleId);
          if (vehicle?.status === 'BLACKLISTED') {
            await processDetectionForBlacklist(detection);
          }
        }
        this.lastPersistenceError = null;
      } catch (error) {
        this.lastPersistenceError = error.message;
        console.error('Failed to persist simulated detections:', error);
      }
    }

    this.liveCameraCounts = new Map();
    for (const vehicle of this.vehicles) {
      if (vehicle.state === 'RESTING') continue; // Don't count resting vehicles as active traffic
      for (const cameraId of vehicle.activeCameras) {
        this.liveCameraCounts.set(cameraId, (this.liveCameraCounts.get(cameraId) || 0) + 1);
      }
    }

    // Keep congestion notifications synchronized with the actual live state.
    await Promise.all(this.cameras.map(async (camera) => {
      const vehicleCount = this.liveCameraCounts.get(camera.id) || 0;
      const existing = await prisma.alert.findFirst({
        where: { cameraId: camera.id, type: 'CONGESTION', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      if (vehicleCount >= 5) {
        const severity = vehicleCount >= 10 ? 'CRITICAL' : 'HIGH';
        const message = `Traffic congestion detected at ${camera.name}: ${vehicleCount} vehicles currently within the camera detection area.`;
        if (existing) {
          await prisma.alert.update({
            where: { id: existing.id },
            data: { severity, message, createdAt: new Date(this.time), resolvedAt: null },
          });
        } else {
          await prisma.alert.create({
            data: {
              type: 'CONGESTION',
              severity,
              cameraId: camera.id,
              message,
              status: 'ACTIVE',
              createdAt: new Date(this.time),
            },
          });
        }
      } else if (existing) {
        await prisma.alert.update({
          where: { id: existing.id },
          data: { status: 'RESOLVED', resolvedAt: new Date(this.time) },
        });
      }
    }));

    this.liveAlerts = []; // Deprecated in favor of DB alerts
  }

  getLiveCameraCounts() {
    return new Map(this.liveCameraCounts);
  }

  /**
   * Vehicles currently within a camera's detection radius, from live
   * simulation state only (never from historical Detection rows). This is
   * what "click a camera, see who's there right now" must use — it answers
   * "who is at this camera right now", not "who has ever been seen here".
   */
  getLiveVehiclesAtCamera(cameraId) {
    if (!this.running) return [];
    return this.vehicles
      .filter((vehicle) => vehicle.state !== 'RESTING' && vehicle.activeCameras?.has(cameraId))
      .map((vehicle) => ({
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.type,
        status: vehicle.status,
        speed: Number.isFinite(vehicle.speed) ? Math.round(vehicle.speed * 10) / 10 : null,
        latitude: vehicle.coords?.[1] ?? null,
        longitude: vehicle.coords?.[0] ?? null,
      }));
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

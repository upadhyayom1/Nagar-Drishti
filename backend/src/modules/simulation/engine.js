const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');
const { recordDetection } = require('../detection/detection.service');

class SimulationEngine {
  constructor() {
    this.running = false;
    this.speed = 1;
    this.time = new Date('2026-01-01T10:00:00Z');
    this.vehicles = [];
    this.cameras = [];
    this.roads = [];
    this.recentDetections = [];
    this.timer = null;
    this.tickRateMs = 1000;
    this.detectionRadiusMeters = 20; 
    
    this.graph = new Map(); // Node -> Array of Edges
    this.nodesList = []; // Helper for picking random nodes
  }

  async init() {
    this.roads = await prisma.road.findMany();
    this.cameras = await prisma.camera.findMany();
    const dbVehicles = await prisma.vehicle.findMany({ where: { status: 'ACTIVE' } });

    this.buildGraph();

    // Map DB vehicles to simulation state
    this.vehicles = dbVehicles.map(v => {
      const startNode = this.nodesList[Math.floor(Math.random() * this.nodesList.length)];
      const destNode = this.selectDestination(startNode);
      const route = this.calculateRoute(startNode, destNode);
      
      const parts = startNode.split(',').map(Number);
      
      return {
        id: v.id,
        plateNumber: v.plateNumber,
        type: v.vehicleType || 'CAR',
        speed: v.speed || 40, // km/h
        
        currentNode: startNode,
        destinationNode: destNode,
        currentRoute: route,
        routeIndex: 0,
        distanceTravelled: 0,
        coords: parts, 
        currentRoadId: route.length > 0 ? route[0].roadId : null,
        
        recentNodes: [startNode],
        activeCameras: new Set()
      };
    });
  }
  
  buildGraph() {
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
    this.running = true;
    this.lastTickTime = Date.now();
    this.timer = setInterval(() => this.tick(), this.tickRateMs);
  }

  pause() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async reset() {
    this.pause();
    this.time = new Date('2026-01-01T10:00:00Z');
    this.recentDetections = [];
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
            
            const camPoint = turf.point([cam.longitude, cam.latitude]);
            const vPoint = turf.point(v.coords);
            const dist = turf.distance(camPoint, vPoint, { units: 'meters' });

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
                        vehicleConfidence: 0.95 + (Math.random() * 0.04),
                        latitude: v.coords[1],
                        longitude: v.coords[0]
                    };
                    detectionsToSave.push(detection);
                    this.recentDetections.unshift(detection);
                    if (this.recentDetections.length > 100) this.recentDetections.pop();
                }
            } else {
                if (v.activeCameras.has(cam.id)) {
                    v.activeCameras.delete(cam.id);
                }
            }
        }
    }

    if (detectionsToSave.length > 0) {
      try {
        await Promise.all(detectionsToSave.map((detection) => recordDetection(detection)));
      } catch (err) {
        console.error('Failed to save simulation detections:', err);
      }
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
        recentDetections: this.recentDetections.length
      },
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
module.exports = engine;

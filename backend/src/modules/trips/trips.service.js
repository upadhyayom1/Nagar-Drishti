const { prisma } = require('../../lib/prisma');
const turf = require('@turf/turf');
const simulationEngine = require('../simulation/engine');

const findNearestNode = (lon, lat) => {
  const point = turf.point([lon, lat]);
  let nearestNode = null;
  let minDistance = Infinity;
  
  for (const node of simulationEngine.nodesList) {
    const coords = node.split(',').map(Number);
    const nodePoint = turf.point(coords);
    const distance = turf.distance(point, nodePoint, { units: 'meters' });
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = node;
    }
  }
  
  return nearestNode;
};

const planTrip = async ({ start, destination }) => {
  const startNode = findNearestNode(start.longitude, start.latitude);
  const destNode = findNearestNode(destination.longitude, destination.latitude);
  
  if (!startNode || !destNode) {
    throw new Error('Could not find nearest road nodes for the provided coordinates.');
  }
  
  const routeEdges = simulationEngine.calculateRoute(startNode, destNode);
  
  let distance = 0;
  let estimatedTime = 0;
  const routeGeometry = { type: 'FeatureCollection', features: [] };
  const roadIds = new Set();
  
  for (const edge of routeEdges) {
    distance += edge.distance;
    
    // Assume 40 km/h average speed if unknown. 40 km/h = ~11.1 m/s
    const speedMs = 11.1; 
    estimatedTime += (edge.distance / speedMs);
    
    roadIds.add(edge.roadId);
    
    routeGeometry.features.push(turf.lineString(edge.geometry));
  }
  
  return {
    distance, // meters
    estimatedTime, // seconds
    routeGeometry,
    roadIds: Array.from(roadIds),
  };
};

const saveTrip = async (userId, data) => {
  return prisma.trip.create({
    data: {
      userId,
      name: data.name,
      startLatitude: data.startLatitude,
      startLongitude: data.startLongitude,
      destinationLatitude: data.destinationLatitude,
      destinationLongitude: data.destinationLongitude,
      distance: data.distance,
      estimatedTime: data.estimatedTime,
      routeGeometry: data.routeGeometry,
    },
  });
};

const getTrips = async (userId) => {
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const deleteTrip = async (id, userId) => {
  // ensure user owns it
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (trip && trip.userId === userId) {
    return prisma.trip.delete({ where: { id } });
  }
  throw new Error('Trip not found or unauthorized');
};

module.exports = {
  planTrip,
  saveTrip,
  getTrips,
  deleteTrip,
};

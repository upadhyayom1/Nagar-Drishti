/**
 * Road network topology service.
 *
 * This builds the same node/edge graph the simulation engine uses (derived
 * from Road.geometry), but as a standalone, lazily-built, cached module so
 * that trajectory reconstruction can ask "what is the network distance
 * between camera A and camera B" without depending on the live simulation
 * engine being initialized or running.
 *
 * This intentionally does not touch the simulation engine's own copy of the
 * graph (backend/src/modules/simulation/engine.js) — the engine has its own
 * routing needs (destination selection, recent-node penalties for avoiding
 * U-turns, etc). This module only answers "shortest network distance
 * between two points", which is all trajectory reconstruction needs.
 *
 * No new database tables are introduced: the graph is derived at runtime
 * from the existing Road rows.
 */

const turf = require('@turf/turf');
const { prisma } = require('../../lib/prisma');

const NEAREST_NODE_MAX_METERS = 300;
const GRAPH_CACHE_MS = 5 * 60 * 1000; // roads change rarely; rebuild at most every 5 minutes

let graph = null; // Map<nodeKey, Array<{ target, distance, roadId }>>
let nodesList = [];
let builtAt = 0;
let buildPromise = null;

function nodeKey(coord) {
  return coord.join(',');
}

function parseNode(key) {
  return key.split(',').map(Number);
}

function buildGraphFromRoads(roads) {
  const nextGraph = new Map();
  const nodeCounts = new Map();

  for (const road of roads) {
    const coords = road.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const uniqueInRoad = new Set(coords.map((c) => c.join(',')));
    for (const key of uniqueInRoad) {
      nodeCounts.set(key, (nodeCounts.get(key) || 0) + 1);
    }
  }

  for (const road of roads) {
    const coords = road.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    let startIdx = 0;
    let startKey = coords[0].join(',');

    for (let i = 1; i < coords.length; i++) {
      const key = coords[i].join(',');
      const isEndpoint = i === coords.length - 1;
      const isIntersection = nodeCounts.get(key) > 1;

      if (isEndpoint || isIntersection) {
        const segmentCoords = coords.slice(startIdx, i + 1);
        if (segmentCoords.length >= 2) {
          const distance = turf.length(turf.lineString(segmentCoords), { units: 'meters' });

          if (!nextGraph.has(startKey)) nextGraph.set(startKey, []);
          if (!nextGraph.has(key)) nextGraph.set(key, []);

          nextGraph.get(startKey).push({ target: key, distance, roadId: road.id });
          nextGraph.get(key).push({ target: startKey, distance, roadId: road.id });
        }
        startIdx = i;
        startKey = key;
      }
    }
  }

  return nextGraph;
}

async function ensureGraph() {
  const isFresh = graph && Date.now() - builtAt < GRAPH_CACHE_MS;
  if (isFresh) return graph;
  if (buildPromise) return buildPromise;

  buildPromise = (async () => {
    const roads = await prisma.road.findMany({ select: { id: true, geometry: true } });
    graph = buildGraphFromRoads(roads);
    nodesList = Array.from(graph.keys());
    builtAt = Date.now();
    buildPromise = null;
    return graph;
  })();

  return buildPromise;
}

/** Force the next call to rebuild the graph (e.g. after roads are edited/seeded). */
function invalidateCache() {
  graph = null;
  nodesList = [];
  builtAt = 0;
}

function findNearestNode(longitude, latitude, maxDistanceMeters = NEAREST_NODE_MAX_METERS) {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  const point = turf.point([longitude, latitude]);
  let bestNode = null;
  let bestDistance = Infinity;

  for (const key of nodesList) {
    const distance = turf.distance(point, turf.point(parseNode(key)), { units: 'meters' });
    if (distance < bestDistance) {
      bestDistance = distance;
      bestNode = key;
    }
  }

  return bestDistance <= maxDistanceMeters ? bestNode : null;
}

/** Plain Dijkstra over the cached graph. Returns total meters, or null if unreachable. */
function shortestPathMeters(startNode, endNode) {
  if (!startNode || !endNode || !graph.has(startNode)) return null;
  if (startNode === endNode) return 0;

  const dist = new Map();
  const unvisited = new Set(nodesList);
  for (const node of nodesList) dist.set(node, Infinity);
  dist.set(startNode, 0);

  while (unvisited.size > 0) {
    let u = null;
    let minDist = Infinity;
    for (const node of unvisited) {
      const d = dist.get(node);
      if (d < minDist) {
        minDist = d;
        u = node;
      }
    }
    if (u === null || u === endNode) break;
    unvisited.delete(u);

    for (const edge of graph.get(u) || []) {
      if (!unvisited.has(edge.target)) continue;
      const alt = dist.get(u) + edge.distance;
      if (alt < dist.get(edge.target)) dist.set(edge.target, alt);
    }
  }

  const result = dist.get(endNode);
  return Number.isFinite(result) ? result : null;
}

/**
 * Network distance in meters between two lat/lng points (e.g. two cameras),
 * or null if there isn't enough network information to route between them
 * (no nearby road node, or no connected path).
 */
async function getNetworkDistanceMeters(pointA, pointB) {
  await ensureGraph();
  if (!nodesList.length) return null;

  const startNode = findNearestNode(pointA.longitude, pointA.latitude);
  const endNode = findNearestNode(pointB.longitude, pointB.latitude);
  if (!startNode || !endNode) return null;

  return shortestPathMeters(startNode, endNode);
}

module.exports = {
  getNetworkDistanceMeters,
  invalidateCache,
};

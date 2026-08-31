const turf = require('@turf/turf');
const { random } = require('./utils');

class RouteGenerator {
  constructor(roads) {
    this.graph = new Map();
    this.nodesList = [];
    this.loadGraph(roads);
  }

  loadGraph(roads) {
    for (const road of roads) {
      if (road.geometry?.type !== 'LineString') continue;
      const coords = road.geometry.coordinates || [];
      for (let index = 1; index < coords.length; index++) {
        const start = coords[index - 1];
        const end = coords[index];
        const startNode = start.join(',');
        const endNode = end.join(',');
        const distance = turf.length(turf.lineString([start, end]), { units: 'meters' });

        if (!this.graph.has(startNode)) this.graph.set(startNode, []);
        if (!this.graph.has(endNode)) this.graph.set(endNode, []);

        this.graph.get(startNode).push({
          target: endNode,
          distance,
          geometry: [start, end],
          roadId: road.id,
        });
        this.graph.get(endNode).push({
          target: startNode,
          distance,
          geometry: [end, start],
          roadId: road.id,
        });
      }
    }
    this.nodesList = Array.from(this.graph.keys());
  }

  hasNode(node) {
    return this.graph.has(node);
  }

  getRandomNode() {
    if (!this.nodesList.length) return null;
    return this.nodesList[Math.floor(random() * this.nodesList.length)];
  }

  getRandomDestination(startNode, { minMeters = 500, maxMeters = Infinity } = {}) {
    if (!this.hasNode(startNode)) return null;
    const start = startNode.split(',').map(Number);
    const candidates = [];

    for (const node of this.nodesList) {
      if (node === startNode) continue;
      const point = node.split(',').map(Number);
      const distance = turf.distance(start, point, { units: 'meters' });
      if (distance >= minMeters && distance <= maxMeters) candidates.push(node);
    }

    if (!candidates.length) {
      const fallback = this.nodesList.filter((node) => node !== startNode);
      return fallback.length ? fallback[Math.floor(random() * fallback.length)] : null;
    }

    return candidates[Math.floor(random() * candidates.length)];
  }

  calculateRoute(startNode, endNode) {
    if (!startNode || !endNode || startNode === endNode) return [];
    if (!this.graph.has(startNode) || !this.graph.has(endNode)) return [];

    const dist = new Map();
    const prev = new Map();
    const unvisited = new Set(this.nodesList);

    for (const node of this.nodesList) dist.set(node, Infinity);
    dist.set(startNode, 0);

    while (unvisited.size > 0) {
      let u = null;
      let minDist = Infinity;

      for (const node of unvisited) {
        const value = dist.get(node);
        if (value < minDist) {
          minDist = value;
          u = node;
        }
      }

      if (u === null || u === endNode) break;
      unvisited.delete(u);

      for (const edge of this.graph.get(u) || []) {
        if (!unvisited.has(edge.target)) continue;

        // Small bounded routing noise keeps alternate routes possible without
        // making a longer path arbitrarily unrealistic.
        const noise = random() < 0.25 ? 1 + random() * 0.12 : 1;
        const alt = dist.get(u) + edge.distance * noise;

        if (alt < dist.get(edge.target)) {
          dist.set(edge.target, alt);
          prev.set(edge.target, { node: u, edge });
        }
      }
    }

    if (!prev.has(endNode)) return [];

    const route = [];
    let current = endNode;
    while (prev.has(current)) {
      const step = prev.get(current);
      route.unshift(step.edge);
      current = step.node;
    }

    return current === startNode ? route : [];
  }

  getRouteDistance(route) {
    return (route || []).reduce((total, edge) => total + Number(edge.distance || 0), 0);
  }
}

module.exports = { RouteGenerator };

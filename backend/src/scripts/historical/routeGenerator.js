const fs = require('fs');
const path = require('path');
const { random, randomWeighted, shuffleArray } = require('./utils');

class RouteGenerator {
  constructor(cameras) {
    this.cameras = cameras;
    this.graph = new Map();
    this.nodesList = [];
    this.loadGraph();
  }

  loadGraph() {
    const geojsonPath = path.join(__dirname, '../../../src/data/city/roads.geojson');
    const roadsFeatureCollection = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

    for (const feature of roadsFeatureCollection.features) {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        const startNode = coords[0].join(',');
        const endNode = coords[coords.length - 1].join(',');
        const distance = feature.properties.length || 10;
        
        if (!this.graph.has(startNode)) this.graph.set(startNode, []);
        if (!this.graph.has(endNode)) this.graph.set(endNode, []);

        this.graph.get(startNode).push({ target: endNode, distance, geometry: coords, roadId: feature.properties.id });
        this.graph.get(endNode).push({ target: startNode, distance, geometry: [...coords].reverse(), roadId: feature.properties.id });
      }
    }
    this.nodesList = Array.from(this.graph.keys());
  }

  getRandomNode() {
    return this.nodesList[Math.floor(random() * this.nodesList.length)];
  }

  calculateRoute(startNode, endNode) {
    if (startNode === endNode) return [];

    const dist = new Map();
    const prev = new Map();
    const unvisited = new Set(this.nodesList);

    for (const node of this.nodesList) dist.set(node, Infinity);
    dist.set(startNode, 0);

    while (unvisited.size > 0) {
      let u = null;
      let minDist = Infinity;
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
        // Inject slight stochastic noise (10% random variation)
        if (random() < 0.3) {
          cost += random() * cost * 0.2; 
        }

        const alt = dist.get(u) + cost;
        if (alt < dist.get(edge.target)) {
          dist.set(edge.target, alt);
          prev.set(edge.target, { node: u, edge: edge });
        }
      }
    }

    const route = [];
    let curr = endNode;
    while (prev.has(curr)) {
      const step = prev.get(curr);
      route.unshift(step.edge);
      curr = step.node;
    }
    return route;
  }
}

module.exports = { RouteGenerator };

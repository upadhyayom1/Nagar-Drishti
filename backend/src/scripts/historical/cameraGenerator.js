const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getDistance, random } = require('./utils');
const turf = require('@turf/turf');

function generateCameras() {
  console.log('Generating strategic camera network...');
  const geojsonPath = path.join(__dirname, '../../../src/data/prayagraj/roads.geojson');
  const roadsFeatureCollection = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

  const nodeConnections = new Map();

  // Process roads to find connectivity (intersections)
  for (const feature of roadsFeatureCollection.features) {
    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates;
      const startNode = coords[0].join(',');
      const endNode = coords[coords.length - 1].join(',');
      
      const roadId = feature.properties.id;

      if (!nodeConnections.has(startNode)) nodeConnections.set(startNode, new Set());
      if (!nodeConnections.has(endNode)) nodeConnections.set(endNode, new Set());

      nodeConnections.get(startNode).add(roadId);
      nodeConnections.get(endNode).add(roadId);
    }
  }

  // Score nodes based on number of connecting roads and some random noise
  const scoredNodes = [];
  for (const [nodeStr, roads] of nodeConnections.entries()) {
    const coords = nodeStr.split(',').map(Number);
    // Score = number of connections + slight randomness to tiebreak
    let score = roads.size;
    
    // Use connection degree to prioritize major road intersections.
    score += random(); 

    scoredNodes.push({
      coords,
      score,
      degree: roads.size,
      connectedRoads: Array.from(roads)
    });
  }

  // Sort descending by score
  scoredNodes.sort((a, b) => b.score - a.score);

  const selectedCameras = [];
  
  for (const node of scoredNodes) {
    if (selectedCameras.length >= config.cameraCount) break;

    // Check minimum spacing
    let tooClose = false;
    for (const cam of selectedCameras) {
      const dist = getDistance(node.coords[0], node.coords[1], cam.longitude, cam.latitude);
      if (dist < config.minCameraSpacingMeters) {
        // We can allow an exception if it's a massive intersection (degree > 4) and we randomly accept it
        if (node.degree > 4 && random() < 0.2) {
           // Allow
        } else {
           tooClose = true;
           break;
        }
      }
    }

    if (!tooClose) {
      selectedCameras.push({
        cameraCode: `C${String(selectedCameras.length + 1).padStart(3, '0')}`,
        name: `Strategic Node ${selectedCameras.length + 1} (Degree ${node.degree})`,
        longitude: node.coords[0],
        latitude: node.coords[1],
        status: 'ONLINE'
      });
    }
  }

  return selectedCameras;
}

module.exports = { generateCameras };

const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/city/osm_raw.json'), 'utf8'));

const nodes = {};
const ways = [];

// Parse nodes and ways
rawData.elements.forEach(el => {
  if (el.type === 'node') {
    nodes[el.id] = [el.lon, el.lat]; // GeoJSON uses [longitude, latitude]
  } else if (el.type === 'way' && el.tags && el.tags.highway) {
    ways.push(el);
  }
});

const features = [];

ways.forEach(way => {
  const coords = way.nodes.map(nodeId => nodes[nodeId]).filter(Boolean);
  
  if (coords.length > 1) {
    features.push({
      type: 'Feature',
      properties: {
        id: way.id,
        name: way.tags.name || 'Unnamed Road',
        highway: way.tags.highway,
        oneway: way.tags.oneway === 'yes',
        maxspeed: way.tags.maxspeed || '50'
      },
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    });
  }
});

const geojson = {
  type: 'FeatureCollection',
  features
};

fs.writeFileSync(path.join(__dirname, '../data/city/roads.geojson'), JSON.stringify(geojson, null, 2));
console.log(`Generated roads.geojson with ${features.length} road segments.`);

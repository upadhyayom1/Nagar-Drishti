const fs = require('fs');
const https = require('https');

const query = `
  [out:json];
  (
    way["highway"](28.625, 77.21, 28.635, 77.225);
  );
  (._;>;);
  out body;
`;

const req = https.request({
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`Error: Status Code ${res.statusCode}`);
      console.error(data.substring(0, 500));
      process.exit(1);
    }
    fs.writeFileSync('src/data/city/osm_raw.json', data);
    console.log('Saved to src/data/city/osm_raw.json');
  });
});

req.write(`data=${encodeURIComponent(query)}`);
req.end();

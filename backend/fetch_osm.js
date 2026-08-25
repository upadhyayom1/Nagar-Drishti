const fs = require('fs');
const https = require('https');
const path = require('path');

const query = `
  [out:json];
  (
    way["highway"](25.385, 81.825, 25.545, 81.945);
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
    const outputPath = path.join(__dirname, 'src/data/prayagraj/osm_raw.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, data);
    console.log(`Saved to ${outputPath}`);
  });
});

req.write(`data=${encodeURIComponent(query)}`);
req.end();

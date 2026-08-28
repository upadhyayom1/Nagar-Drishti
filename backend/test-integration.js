const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testEndpoint(name, url) {
  try {
    const res = await axios.get(`${BASE_URL}${url}`, { timeout: 10000 });
    console.log(`[PASS] ${name.padEnd(30)} -> HTTP ${res.status} | Data Items: ${Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data).length : 'Object/Number'}`);
    return { name, status: 'PASS', code: res.status };
  } catch (err) {
    console.error(`[FAIL] ${name.padEnd(30)} -> ${err.message} (${err.response?.status || 'No Response'})`);
    return { name, status: 'FAIL', error: err.message };
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' NAGAR-DRISHTI FULL END-TO-END INTEGRATION TEST');
  console.log('====================================================\n');

  // 1. Fetch a real camera and vehicle ID first
  const camerasRes = await axios.get(`${BASE_URL}/cameras`);
  const firstCamera = camerasRes.data.data[0];
  const cameraId = firstCamera?.id || 'cmtbiv1xr000s3girjz728je4';

  const vehiclesRes = await axios.get(`${BASE_URL}/vehicles?limit=1`);
  const firstVehicle = vehiclesRes.data.data[0];
  const plate = firstVehicle?.plateNumber || 'UP36HM2338';

  console.log(`Testing with Live DB Fixtures: Camera ID: ${cameraId}, Plate: ${plate}\n`);

  const tests = [
    ['Cameras List', '/cameras'],
    ['Camera Details', `/cameras/${cameraId}`],
    ['Camera Detections', `/detections/camera/${cameraId}?limit=10`],
    ['Roads List', '/roads'],
    ['Vehicles Catalog', '/vehicles'],
    ['Vehicles Search', '/vehicles/search?q=UP'],
    ['Vehicle Profile', `/vehicles/${plate}`],
    ['Vehicle Detections', `/detections/vehicle/${plate}?limit=10`],
    ['Vehicle Journey (Trajectory)', `/vehicles/journey/${plate}`],
    ['Sentinel Alerts', '/alerts'],
    ['Active Alert Count', '/alerts/active/count'],
    ['Blacklist Raw List', '/blacklist'],
    ['Blacklist Intelligence Grid', '/blacklist/intelligence'],
    ['Analytics Overview', '/analytics/overview'],
    ['Analytics Hourly Curve', '/analytics/hourly'],
    ['Analytics Camera Traffic', '/analytics/cameras'],
    ['Analytics Busiest Roads', '/analytics/busiest-roads'],
    ['Analytics Network Corridors', '/analytics/network'],
    ['Analytics System Health', '/analytics/system'],
  ];

  const results = [];
  for (const [name, path] of tests) {
    const res = await testEndpoint(name, path);
    results.push(res);
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n====================================================');
  console.log(` INTEGRATION RESULTS: ${passed}/${tests.length} PASSED (${failed} FAILED)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);

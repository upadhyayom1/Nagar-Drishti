const config = require('./config');
const { randomInt, randomWeighted, random } = require('./utils');
const { NODES } = require('../../data/prayagraj.network');

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const defaultNodeKeys = Object.keys(NODES);

function generatePlate(state) {
  const code = state === 'OTHER' ? 'CG' : state;
  const num1 = String(randomInt(1, 99)).padStart(2, '0');
  const let1 = letters[randomInt(0, 25)];
  const let2 = letters[randomInt(0, 25)];
  const num2 = String(randomInt(1, 9999)).padStart(4, '0');
  return `${code}${num1}${let1}${let2}${num2}`;
}

function pickNode(nodeKeys) {
  return nodeKeys[Math.floor(random() * nodeKeys.length)];
}

function generateVehicles(options = {}) {
  const nodeKeys = Array.isArray(options.nodeKeys) && options.nodeKeys.length
    ? options.nodeKeys
    : defaultNodeKeys;

  console.log(`Generating ${config.vehicleCount} synthetic vehicles...`);
  const vehicles = [];
  const usedPlates = new Set();

  for (let i = 0; i < config.vehicleCount; i++) {
    const state = randomWeighted(config.stateDistribution);

    let plateNumber;
    do {
      plateNumber = generatePlate(state);
    } while (usedPlates.has(plateNumber));
    usedPlates.add(plateNumber);

    const vehicleType = randomWeighted(config.vehicleTypes);
    const profile = randomWeighted(config.profiles);

    // These are persistent behavioral anchors. They are not database schema fields;
    // they stay with the in-memory historical profile for all simulated days.
    const homeNode = pickNode(nodeKeys);
    let workNode = pickNode(nodeKeys);
    let guard = 0;
    while (workNode === homeNode && guard++ < 20) workNode = pickNode(nodeKeys);

    vehicles.push({
      plateNumber,
      vehicleType,
      profile,
      homeNode,
      workNode,
      currentLocation: homeNode,
      status: 'ACTIVE',
    });
  }

  return vehicles;
}

module.exports = { generateVehicles };

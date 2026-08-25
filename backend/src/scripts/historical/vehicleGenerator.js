const config = require('./config');
const { randomInt, randomWeighted, shuffleArray } = require('./utils');

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generatePlate(state) {
  const code = state === 'OTHER' ? 'MP' : state;
  const num1 = String(randomInt(1, 99)).padStart(2, '0');
  const let1 = letters[randomInt(0, 25)];
  const let2 = letters[randomInt(0, 25)];
  const num2 = String(randomInt(1, 9999)).padStart(4, '0');
  return `${code}${num1}${let1}${let2}${num2}`;
}

function generateVehicles() {
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

    const type = randomWeighted(config.vehicleTypes);
    const profile = randomWeighted(config.profiles);
    
    vehicles.push({
      plateNumber,
      vehicleType: type,
      profile, // Used by the generator later
      status: 'ACTIVE'
    });
  }

  return vehicles;
}

module.exports = { generateVehicles };

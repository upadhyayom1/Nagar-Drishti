const turf = require('@turf/turf');
const config = require('./config');

// Simple seeded PRNG (Mersenne Twister logic simplified or LCG)
// Using a basic Linear Congruential Generator for simplicity and speed
let currentSeed = config.seed;

function setSeed(seed) {
  currentSeed = seed;
}

function random() {
  currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
  return currentSeed / 4294967296;
}

// Random value between min and max
function randomRange(min, max) {
  return min + random() * (max - min);
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

// Weighted random selection based on a distribution object
// e.g. { 'CAR': 0.45, 'BUS': 0.05 }
function randomWeighted(distribution) {
  let r = random();
  for (const [key, weight] of Object.entries(distribution)) {
    if (r < weight) return key;
    r -= weight;
  }
  // Fallback to last key if floating point math is slightly off
  return Object.keys(distribution).pop();
}

// Haversine distance in meters
function getDistance(lon1, lat1, lon2, lat2) {
  const point1 = turf.point([lon1, lat1]);
  const point2 = turf.point([lon2, lat2]);
  return turf.distance(point1, point2, { units: 'meters' });
}

// Shuffle array using Fisher-Yates and our seeded PRNG
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = {
  setSeed,
  random,
  randomRange,
  randomInt,
  randomWeighted,
  getDistance,
  shuffleArray
};

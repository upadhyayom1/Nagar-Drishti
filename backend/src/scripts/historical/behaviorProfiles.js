const { randomRange, random, randomInt } = require('./utils');

function trip(hour, type) {
  return { hour, type };
}

function getDailyTrips(profile, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const trips = [];

  if (profile === 'COMMUTER') {
    if (isWeekend) {
      if (random() < 0.35) trips.push(trip(randomRange(10, 16), 'RANDOM_TRIP'));
      if (random() < 0.20) trips.push(trip(randomRange(17, 20), 'RANDOM_TRIP'));
    } else {
      if (random() < 0.95) trips.push(trip(randomRange(7, 9.5), 'COMMUTE_TO_WORK'));
      if (random() < 0.12) trips.push(trip(randomRange(12, 14), 'RANDOM_TRIP'));
      if (random() < 0.95) trips.push(trip(randomRange(17, 19.5), 'COMMUTE_TO_HOME'));
    }
  } else if (profile === 'RANDOM_DRIVER') {
    const count = isWeekend ? randomInt(1, 3) : randomInt(1, 2);
    for (let i = 0; i < count; i++) trips.push(trip(randomRange(8, 21), 'RANDOM_TRIP'));
  } else if (profile === 'DELIVERY') {
    const count = isWeekend ? randomInt(1, 3) : randomInt(3, 7);
    for (let i = 0; i < count; i++) trips.push(trip(randomRange(7, 18), 'RANDOM_TRIP'));
  } else if (profile === 'RIDE_HAIL') {
    const count = randomInt(5, 12);
    for (let i = 0; i < count; i++) trips.push(trip(randomRange(5, 22), 'RANDOM_TRIP'));
  } else if (profile === 'LONG_HAUL_TRUCK') {
    if (random() < 0.20) trips.push(trip(randomRange(2, 20), 'LONG_HAUL'));
  } else if (profile === 'COMMERCIAL') {
    if (!isWeekend) {
      const count = randomInt(2, 4);
      for (let i = 0; i < count; i++) trips.push(trip(randomRange(6, 17), 'RANDOM_TRIP'));
    }
  } else if (profile === 'OCCASIONAL_VISITOR') {
    if (random() < 0.10) trips.push(trip(randomRange(10, 20), 'RANDOM_TRIP'));
  } else if (profile === 'TAXI') {
    const count = randomInt(4, 10);
    for (let i = 0; i < count; i++) trips.push(trip(randomRange(6, 23), 'RANDOM_TRIP'));
  }

  return trips.sort((a, b) => a.hour - b.hour);
}

function getCongestionMultiplier(hour) {
  if (hour >= 7 && hour < 10) return randomRange(1.35, 1.85);
  if (hour >= 17 && hour < 20) return randomRange(1.45, 1.95);
  if (hour >= 10 && hour < 17) return randomRange(1.10, 1.45);
  if (hour >= 20 && hour < 23) return randomRange(1.00, 1.25);
  return randomRange(0.85, 1.00);
}

function getBaseSpeedMps(vehicleType) {
  const kmhToMps = 1000 / 3600;
  switch (vehicleType) {
    case 'CAR': return randomRange(32, 45) * kmhToMps;
    case 'MOTORCYCLE': return randomRange(35, 50) * kmhToMps;
    case 'SCOOTER': return randomRange(28, 40) * kmhToMps;
    case 'AUTO': return randomRange(20, 32) * kmhToMps;
    case 'BUS': return randomRange(18, 30) * kmhToMps;
    case 'TRUCK': return randomRange(20, 32) * kmhToMps;
    case 'VAN': return randomRange(26, 38) * kmhToMps;
    case 'TAXI': return randomRange(32, 45) * kmhToMps;
    default: return randomRange(25, 40) * kmhToMps;
  }
}

module.exports = { getDailyTrips, getCongestionMultiplier, getBaseSpeedMps };

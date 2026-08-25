const { randomRange, random } = require('./utils');

function getDailyTrips(profile, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // returns an array of hours (float) representing start times for trips
  let trips = [];
  
  if (profile === 'COMMUTER') {
    if (isWeekend) {
      if (random() < 0.2) trips.push(randomRange(10, 18));
    } else {
      // Morning commute (7-10)
      if (random() < 0.95) trips.push(randomRange(7, 10));
      // Evening commute (17-20)
      if (random() < 0.95) trips.push(randomRange(17, 20));
      // Occasional lunch trip
      if (random() < 0.1) trips.push(randomRange(12, 14));
    }
  } 
  else if (profile === 'RANDOM_DRIVER') {
    const tripCount = isWeekend ? Math.floor(randomRange(0, 4)) : Math.floor(randomRange(0, 2));
    for (let i = 0; i < tripCount; i++) {
      trips.push(randomRange(8, 22));
    }
  }
  else if (profile === 'DELIVERY') {
    // Deliveries mostly on weekdays, multiple trips
    const tripCount = isWeekend ? Math.floor(randomRange(0, 3)) : Math.floor(randomRange(3, 8));
    for (let i = 0; i < tripCount; i++) {
      trips.push(randomRange(7, 19));
    }
  }
  else if (profile === 'TAXI') {
    const tripCount = Math.floor(randomRange(4, 12));
    for (let i = 0; i < tripCount; i++) {
      // Taxis run any time, slight preference to peaks but broad spread
      trips.push(randomRange(4, 23));
    }
  }
  else if (profile === 'COMMERCIAL') {
    if (!isWeekend) {
      const tripCount = Math.floor(randomRange(1, 4));
      for (let i = 0; i < tripCount; i++) {
        trips.push(randomRange(6, 17));
      }
    }
  }
  else if (profile === 'OCCASIONAL_VISITOR') {
    if (random() < 0.05) {
      trips.push(randomRange(10, 21));
    }
  }

  // Sort chronologically
  return trips.sort((a, b) => a - b);
}

function getCongestionMultiplier(hour) {
  // Rough time of day multiplier
  if (hour >= 7 && hour < 10) return randomRange(1.3, 2.0); // Morning peak
  if (hour >= 17 && hour < 20) return randomRange(1.4, 2.2); // Evening peak
  if (hour >= 10 && hour < 17) return randomRange(1.1, 1.5); // Daytime
  if (hour >= 20 && hour < 23) return randomRange(1.0, 1.3); // Evening
  return randomRange(0.8, 1.0); // Night (fast)
}

function getBaseSpeedMps(vehicleType) {
  // Speed in km/h -> m/s
  const kmhToMps = 1000 / 3600;
  switch (vehicleType) {
    case 'CAR': return randomRange(30, 45) * kmhToMps;
    case 'MOTORCYCLE': return randomRange(30, 50) * kmhToMps;
    case 'SCOOTER': return randomRange(25, 40) * kmhToMps;
    case 'AUTO': return randomRange(20, 35) * kmhToMps;
    case 'BUS': return randomRange(15, 30) * kmhToMps;
    case 'TRUCK': return randomRange(15, 30) * kmhToMps;
    case 'VAN': return randomRange(25, 40) * kmhToMps;
    case 'TAXI': return randomRange(30, 45) * kmhToMps;
    default: return randomRange(20, 40) * kmhToMps;
  }
}

module.exports = { getDailyTrips, getCongestionMultiplier, getBaseSpeedMps };

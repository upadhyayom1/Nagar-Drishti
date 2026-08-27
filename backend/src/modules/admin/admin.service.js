const { prisma } = require('../../lib/prisma');
const trafficService = require('../traffic/traffic.service');

const getDashboardSummary = async () => {
  const [
    complaintsTotal, complaintsSubmitted, complaintsInProgress, complaintsResolved,
    incidentsActive, incidentsCritical, incidentsHigh,
    blacklistAlertsActive
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    
    prisma.incident.count({ where: { status: 'ACTIVE' } }),
    prisma.incident.count({ where: { status: 'ACTIVE', severity: 'CRITICAL' } }),
    prisma.incident.count({ where: { status: 'ACTIVE', severity: 'HIGH' } }),
    
    prisma.blacklistAlert.count({ where: { status: 'NEW' } }), // Assuming NEW or ACTIVE
  ]);

  const trafficSummary = await trafficService.getTrafficSummary();

  return {
    complaints: {
      total: complaintsTotal,
      submitted: complaintsSubmitted,
      inProgress: complaintsInProgress,
      resolved: complaintsResolved,
    },
    incidents: {
      active: incidentsActive,
      critical: incidentsCritical,
      high: incidentsHigh,
    },
    traffic: {
      highCongestionRoads: trafficSummary.highCongestion,
      severeCongestionRoads: trafficSummary.severeCongestion,
    },
    blacklist: {
      activeAlerts: blacklistAlertsActive,
    },
  };
};

module.exports = {
  getDashboardSummary,
};

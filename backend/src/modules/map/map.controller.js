const { prisma } = require('../../lib/prisma');
const trafficService = require('../traffic/traffic.service');
const incidentsService = require('../incidents/incidents.service');
const complaintsService = require('../complaints/complaints.service');

const getMapOverview = async (req, res) => {
  try {
    const roads = await prisma.road.findMany();
    const traffic = await trafficService.getRoadTrafficData();
    const incidents = await incidentsService.getIncidents({ status: 'ACTIVE' });
    
    // For normal users, maybe we only show public complaints, for now show all active ones
    const complaints = await complaintsService.getComplaints({
      status: { in: ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS'] }
    });

    res.status(200).json({
      success: true,
      mapData: {
        roads,
        traffic,
        incidents,
        complaints,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getMapOverview,
};

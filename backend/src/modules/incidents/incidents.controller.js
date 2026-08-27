const { z } = require('zod');
const incidentsService = require('./incidents.service');

const getMapIncidents = async (req, res) => {
  try {
    const { type, severity, status } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;

    // TODO: implement bounding box or radius using PostGIS/Prisma if needed, 
    // for now we'll just return based on simple filters.
    const incidents = await incidentsService.getIncidents(filters);
    
    const mapped = incidents.map(i => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      latitude: i.latitude,
      longitude: i.longitude,
      status: i.status,
      timestamp: i.timestamp,
      title: i.title,
    }));

    res.status(200).json({ success: true, incidents: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getMapIncidents,
};

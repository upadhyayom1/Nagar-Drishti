const { prisma } = require('../../lib/prisma');

const createIncident = async (data) => {
  return prisma.incident.create({
    data,
  });
};

const getIncidents = async (filters) => {
  return prisma.incident.findMany({
    where: filters,
    orderBy: { timestamp: 'desc' },
  });
};

const getIncidentById = async (id) => {
  return prisma.incident.findUnique({
    where: { id },
  });
};

const updateIncident = async (id, data) => {
  return prisma.incident.update({
    where: { id },
    data,
  });
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
};

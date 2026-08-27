const { prisma } = require('../../lib/prisma');

const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const getUserTrips = async (id) => {
  return prisma.trip.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  });
};

const getUserComplaints = async (id) => {
  return prisma.complaint.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
  });
};

const getUserIncidents = async (userId) => {
  // Get incidents that are linked to this user's complaints
  const complaints = await prisma.complaint.findMany({
    where: { 
      userId,
      incidentId: { not: null }
    },
    select: { incidentId: true }
  });
  
  const incidentIds = complaints.map(c => c.incidentId);
  
  if (incidentIds.length === 0) return [];
  
  return prisma.incident.findMany({
    where: { id: { in: incidentIds } },
    orderBy: { timestamp: 'desc' },
  });
};

module.exports = {
  getUserById,
  updateUser,
  getUserTrips,
  getUserComplaints,
  getUserIncidents,
};

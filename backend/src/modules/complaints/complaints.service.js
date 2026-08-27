const { prisma } = require('../../lib/prisma');

const createComplaint = async (userId, data) => {
  return prisma.complaint.create({
    data: {
      userId,
      ...data,
    },
  });
};

const getComplaints = async (filters) => {
  // Simple filtering
  return prisma.complaint.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    }
  });
};

const getComplaintById = async (id) => {
  return prisma.complaint.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    }
  });
};

const updateComplaint = async (id, data) => {
  return prisma.complaint.update({
    where: { id },
    data,
  });
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
};

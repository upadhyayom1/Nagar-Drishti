const { prisma } = require('../../lib/prisma');

exports.getRoads = async (req, res) => {
  try {
    const roads = await prisma.road.findMany();
    res.status(200).json({ success: true, data: roads });
  } catch (error) {
    console.error('Error fetching roads:', error);
    res.status(500).json({ success: false, message: 'Server error fetching roads' });
  }
};

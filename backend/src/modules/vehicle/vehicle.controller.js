const { prisma } = require('../../lib/prisma');

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE'
      }
    });
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, message: 'Server error fetching vehicles' });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

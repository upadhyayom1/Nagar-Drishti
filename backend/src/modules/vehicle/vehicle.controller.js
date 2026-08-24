<<<<<<< HEAD
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
=======
const { getVehicleProfile } = require('./vehicle.intelligence.service');

async function searchVehicle(req, res, next) {
  try {
    const { plateNumber } = req.params;
    
    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        message: 'Plate number is required'
      });
    }

    const profile = await getVehicleProfile(plateNumber);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `No vehicle found for plate: ${plateNumber}`
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchVehicle
>>>>>>> 5a4e8c3 (Update backend files)
};

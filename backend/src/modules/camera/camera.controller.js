const { prisma } = require('../../lib/prisma');

exports.getCameras = async (req, res) => {
  try {
    const cameras = await prisma.camera.findMany();
    res.status(200).json({ success: true, data: cameras });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cameras' });
  }
};

exports.getCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const camera = await prisma.camera.findUnique({ where: { id } });
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found' });
    res.status(200).json({ success: true, data: camera });
  } catch (error) {
    console.error('Error fetching camera:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

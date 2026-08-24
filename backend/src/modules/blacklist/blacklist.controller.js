const blacklistService = require('./blacklist.service');

const getBlacklistedVehicles = async (req, res) => {
  try {
    const { status } = req.query;
    const vehicles = await blacklistService.getBlacklistedVehicles({ status });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addBlacklistedVehicle = async (req, res) => {
  try {
    const vehicle = await blacklistService.addBlacklistedVehicle(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deactivateBlacklistedVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await blacklistService.deactivateBlacklistedVehicle(id);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const checkPlate = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    const result = await blacklistService.checkPlate(plateNumber);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await blacklistService.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBlacklistedVehicles,
  addBlacklistedVehicle,
  deactivateBlacklistedVehicle,
  checkPlate,
  getAlerts
};

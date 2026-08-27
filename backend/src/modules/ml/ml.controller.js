const mlService = require('./ml.service');

const analyzeVehicle = async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle identifier is required',
      });
    }

    const result = await mlService.analyzeVehicle(identifier);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze vehicle movement',
    });
  }
};

module.exports = {
  analyzeVehicle,
};
const axios = require('axios');
const { env } = require('../../config/env');

const analyzeVehicle = async (identifier) => {
  try {
    const response = await axios.get(
      `${env.ML_SERVICE_URL}/api/vehicle/${encodeURIComponent(identifier)}/ocr-analysis`,
      { timeout: 5000 }
    );

    return response.data;
  } catch (error) {
    console.error(
      'ML Service Error:',
      error.response?.data || error.message
    );

    throw error;
  }
};

module.exports = {
  analyzeVehicle,
};

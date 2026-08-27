const axios = require('axios');

const analyzeVehicle = async (identifier) => {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8000/api/analyze/${encodeURIComponent(identifier)}`
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
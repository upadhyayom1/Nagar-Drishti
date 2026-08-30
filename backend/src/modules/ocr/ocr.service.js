const FormData = require('form-data');
const axios = require('axios');
const { env } = require('../../config/env');

const recognizePlate = async (imageBuffer, originalName, mimeType) => {
  try {
    const form = new FormData();

    form.append('file', imageBuffer, {
      filename: originalName,
      contentType: mimeType,
    });

    const response = await axios.post(`${env.ANPR_SERVICE_URL}/api/recognize`, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Length': form.getLengthSync()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });
    const results = response.data.results || [];

    if (!results || results.length === 0) {
      return [];
    }

    const plates = results
      .filter((result) => result.plateNumber)
      .sort((left, right) => (right.confidence || 0) - (left.confidence || 0))
      .map(plate => ({
        plateNumber: plate.plateNumber?.toUpperCase() || null,
        confidence: plate.confidence || 0,
      }));

    return plates.length > 0 ? plates : [];
  } catch (error) {
    console.error(
      'OCR Service Error:',
      error.response?.data || error.message
    );

    throw new Error('OCR processing failed');
  }
};

const getStatus = async () => {
  try {
    const response = await axios.get(`${env.ANPR_SERVICE_URL}/health`, { timeout: 3000 });
    return { configured: Boolean(response.data?.modelAvailable), provider: response.data?.provider || 'local-yolo-anpr' };
  } catch (error) {
    return { configured: false, provider: 'local-yolo-anpr' };
  }
};

module.exports = {
  recognizePlate,
  getStatus,
};

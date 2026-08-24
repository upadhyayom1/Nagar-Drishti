const FormData = require('form-data');
const axios = require('axios');

const recognizePlate = async (imageBuffer, originalName, mimeType) => {
  try {
    const form = new FormData();

    form.append('upload', imageBuffer, {
      filename: originalName,
      contentType: mimeType,
    });

    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Token ${process.env.PLATE_RECOGNIZER_API_KEY}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const results = response.data.results;

    if (!results || results.length === 0) {
      return {
        plateNumber: null,
        confidence: 0,
      };
    }

    const plate = results[0];

    return {
      plateNumber: plate.plate?.toUpperCase() || null,
      confidence: plate.score || 0,
    };
  } catch (error) {
    console.error(
      'OCR Service Error:',
      error.response?.data || error.message
    );

    throw new Error('OCR processing failed');
  }
};

module.exports = {
  recognizePlate,
};
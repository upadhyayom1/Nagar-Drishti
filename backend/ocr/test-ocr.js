require('dotenv').config();

const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Please provide an image path');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error('Image not found:', imagePath);
  process.exit(1);
}

const recognizePlate = async () => {
  try {
    const form = new FormData();

    form.append('upload', fs.createReadStream(imagePath));

    const response = await axios.post(
      'https://api.platerecognizer.com/v1/plate-reader/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Token ${process.env.PLATE_RECOGNIZER_API_KEY}`,
        },
      }
    );

    const results = response.data.results;

    if (!results || results.length === 0) {
      console.log('No plate detected');
      return;
    }

    const plate = results[0];

    const result = {
      plateNumber: plate.plate?.toUpperCase() || null,
      confidence: plate.score || 0,
      timestamp: new Date().toISOString(),
      cameraId: 'CAM_001',
    };

    console.log('\nOCR RESULT:\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(
      'OCR Error:',
      error.response?.data || error.message
    );
  }
};

recognizePlate();
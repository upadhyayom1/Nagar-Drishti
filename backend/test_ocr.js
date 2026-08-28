const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  try {
    const form = new FormData();
    // create a dummy image
    fs.writeFileSync('dummy.jpg', 'fake image data');
    form.append('plateImages', fs.createReadStream('dummy.jpg'));
    form.append('cameraId', 'CAM123');
    form.append('captureTime', new Date().toISOString());

    const res = await axios.post('http://localhost:8000/api/ocr', form, {
      headers: form.getHeaders(),
    });
    console.log('Success:', res.status, res.data);
  } catch (err) {
    console.log('Error:', err.response?.status, err.response?.data);
  }
}
testUpload();

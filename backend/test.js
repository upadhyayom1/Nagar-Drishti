const axios = require("axios");
async function test() {
  try {
    const res = await axios.post("http://127.0.0.1:8001/ml/api/forecast/congestion?minutes=30", {
      recent_traffic: []
    });
    console.log("Success", res.status);
  } catch(e) {
    console.log("Error", e.message, e.response?.data);
  }
}
test();

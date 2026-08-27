const trafficService = require('./traffic.service');

const getRoadTrafficData = async (req, res) => {
  try {
    const data = await trafficService.getRoadTrafficData();
    res.status(200).json({ success: true, traffic: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getRoadTraffic = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await trafficService.getRoadTraffic(id);
    res.status(200).json({ success: true, traffic: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTrafficSummary = async (req, res) => {
  try {
    const data = await trafficService.getTrafficSummary();
    res.status(200).json({ success: true, summary: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getRoadTrafficData,
  getRoadTraffic,
  getTrafficSummary,
};

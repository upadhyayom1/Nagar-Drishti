const trafficService = require('./traffic.service');
const axios = require('axios');
const { env } = require('../../config/env');

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

const { prisma } = require('../../lib/prisma');

const getForecast = async (req, res) => {
  try {
    const { horizon_mins, capacity_threshold } = req.query;
    
    const mlUrl = new URL(`${env.ML_SERVICE_URL}/api/forecast/congestion`);
    if (horizon_mins) mlUrl.searchParams.append('horizon_mins', horizon_mins);
    if (capacity_threshold) mlUrl.searchParams.append('capacity_threshold', capacity_threshold);

    const response = await axios.get(mlUrl.toString());
    const data = response.data;

    // Map camera_id to camera_name
    if (data && data.forecast_details) {
      const cameras = await prisma.camera.findMany({ select: { id: true, name: true, cameraCode: true } });
      const cameraMap = new Map(cameras.map(c => [c.id, c.name || c.cameraCode]));
      
      data.forecast_details = data.forecast_details.map(detail => {
        return {
          ...detail,
          camera_id: cameraMap.get(detail.camera_id) || detail.camera_id
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Traffic Forecast Controller Error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic forecast from ML service',
    });
  }
};

module.exports = {
  getRoadTrafficData,
  getRoadTraffic,
  getTrafficSummary,
  getForecast,
};

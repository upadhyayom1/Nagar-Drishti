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
    const horizonMinutes = req.query.minutes ? parseInt(req.query.minutes, 10) : undefined;
    const capacity_threshold = req.query.threshold;

    // 1. Gather live traffic data for the last 60 minutes for the ML model's lag features
    const now = new Date();
    const coeff = 1000 * 60 * 15; // 15-minute bins
    const roundedNow = new Date(Math.floor(now.getTime() / coeff) * coeff);
    
    // We want the last 4 buckets (60 mins total)
    const startTime = new Date(roundedNow.getTime() - (4 * coeff));

    // Fetch live detections
    const recentDetections = await prisma.detection.findMany({
      where: { timestamp: { gte: startTime } },
      select: { cameraId: true, timestamp: true, vehicleId: true }
    });
    
    const cameras = await prisma.camera.findMany({ include: { zone: true } });
    const cameraMap = new Map(cameras.map(c => [c.id, c]));

    // Group into 15-minute buckets per camera
    const grouped = {};
    for (const d of recentDetections) {
      const binTime = new Date(Math.floor(d.timestamp.getTime() / coeff) * coeff);
      const binKey = `${d.cameraId}_${binTime.toISOString()}`;
      if (!grouped[binKey]) {
        grouped[binKey] = {
          camera_id: d.cameraId,
          time_bin: binTime.toISOString(),
          vehicle_set: new Set(),
          zone_id: cameraMap.get(d.cameraId)?.zone?.name || 'Unassigned'
        };
      }
      grouped[binKey].vehicle_set.add(d.vehicleId);
    }

    const recent_traffic = Object.values(grouped).map(g => ({
      camera_id: g.camera_id,
      time_bin: g.time_bin,
      vehicle_count: g.vehicle_set.size,
      zone_id: g.zone_id
    }));

    // Generate zero-filled buckets for all cameras to ensure complete lags
    for (const cam of cameras) {
      for (let i = 0; i < 4; i++) {
        const binTime = new Date(roundedNow.getTime() - (i * coeff)).toISOString();
        if (!recent_traffic.find(t => t.camera_id === cam.id && t.time_bin === binTime)) {
          recent_traffic.push({
            camera_id: cam.id,
            time_bin: binTime,
            vehicle_count: 0,
            zone_id: cam.zone?.name || 'Unassigned'
          });
        }
      }
    }

    const mlUrl = new URL(`${env.ML_SERVICE_URL}/api/forecast/congestion`);
    if (horizonMinutes !== undefined) mlUrl.searchParams.append('minutes', String(horizonMinutes));
    if (capacity_threshold) mlUrl.searchParams.append('threshold', capacity_threshold);

    const response = await axios.post(mlUrl.toString(), { recent_traffic });
    const data = response.data;

    if (data && data.forecast_details) {
      data.forecast_details = data.forecast_details.map(detail => {
        return {
          ...detail,
          camera_id: cameraMap.get(detail.camera_id)?.name || cameraMap.get(detail.camera_id)?.cameraCode || detail.camera_id
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

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./modules/auth/auth.routes');

const ocrRoutes = require('./modules/ocr/ocr.routes');


const devRoutes = require('./modules/dev/dev.routes');
const roadRoutes = require('./modules/road/road.routes');
const cameraRoutes = require('./modules/camera/camera.routes');
const vehicleRoutes = require('./modules/vehicle/vehicle.routes');
const simulationRoutes = require('./modules/simulation/simulation.routes');
const detectionRoutes = require('./modules/detection/detection.routes');
const trafficRoutes = require('./modules/traffic/traffic.routes');
const usersRoutes = require('./modules/users/users.routes');
const tripsRoutes = require('./modules/trips/trips.routes');
const mlRoutes = require('./modules/ml/ml.routes');
const mapRoutes = require('./modules/map/map.routes');
const incidentsRoutes = require('./modules/incidents/incidents.routes');
const complaintsRoutes = require('./modules/complaints/complaints.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const blacklistRoutes = require('./modules/blacklist/blacklist.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const alertRoutes = require('./modules/alert/alert.routes');
const { env } = require('./config/env');
const app = express();

const allowedOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));

// Serve the test frontend
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const isCorsError = err.message === 'Origin is not allowed by CORS';
  if (!isCorsError) {
    console.error(err.stack);
  }
  res.status(isCorsError ? 403 : 500).json({
    success: false,
    message: isCorsError ? err.message : 'Internal Server Error',
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

module.exports = app;

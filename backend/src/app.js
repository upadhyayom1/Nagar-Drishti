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
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://nagardrishti.vercel.app'
  ],
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



const blacklistRoutes = require('./modules/blacklist/blacklist.routes');
app.use('/api/blacklist', blacklistRoutes);

const analyticsRoutes = require('./modules/analytics/analytics.routes');
app.use('/api/analytics', analyticsRoutes);

const alertRoutes = require('./modules/alert/alert.routes');
app.use('/api/alerts', alertRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Initialize simulation engine
const engine = require('./modules/simulation/engine');
engine.init().then(() => {
  console.log('Simulation engine initialized with DB data.');
}).catch(err => {
  console.error('Failed to init simulation engine:', err);
});

module.exports = app;


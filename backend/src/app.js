const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./modules/auth/auth.routes');

const ocrRoutes = require('./modules/ocr/ocr.routes');


const usersRoutes = require('./modules/users/users.routes');
const complaintsRoutes = require('./modules/complaints/complaints.routes');
const incidentsRoutes = require('./modules/incidents/incidents.routes');
const trafficRoutes = require('./modules/traffic/traffic.routes');
const tripsRoutes = require('./modules/trips/trips.routes');
const mapRoutes = require('./modules/map/map.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const devRoutes = require('./modules/dev/dev.routes');
const roadRoutes = require('./modules/road/road.routes');
const cameraRoutes = require('./modules/camera/camera.routes');
const vehicleRoutes = require('./modules/vehicle/vehicle.routes');
const simulationRoutes = require('./modules/simulation/simulation.routes');
const detectionRoutes = require('./modules/detection/detection.routes');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Serve the test frontend
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/ocr', ocrRoutes);



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
  engine.start();
  console.log('Simulation engine started automatically.');
}).catch(err => {
  console.error('Failed to init simulation engine:', err);
});

module.exports = app;

const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./modules/auth/auth.routes');
const devRoutes = require('./modules/dev/dev.routes');
const app = express();

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dev',devRoutes);
// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;

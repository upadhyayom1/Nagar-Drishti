const engine = require('./engine');

exports.getState = (req, res) => {
  res.json({ success: true, data: engine.getState() });
};

exports.start = (req, res) => {
  try {
    engine.start();
    res.json({ success: true, message: 'Simulation started', state: engine.getState() });
  } catch (error) {
    res.status(409).json({ success: false, message: error.message, state: engine.getState() });
  }
};

exports.pause = (req, res) => {
  engine.pause();
  res.json({ success: true, message: 'Simulation paused', state: engine.getState() });
};

exports.reset = async (req, res) => {
  try {
    await engine.reset();
    res.json({ success: true, message: 'Simulation reset', state: engine.getState() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setSpeed = (req, res) => {
  const { speed } = req.body;
  if (!Number.isFinite(speed) || speed <= 0 || speed > 50) {
    return res.status(400).json({ success: false, message: 'Invalid speed' });
  }
  engine.setSpeed(speed);
  res.json({ success: true, message: `Simulation speed set to ${speed}x`, state: engine.getState() });
};

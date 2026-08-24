const engine = require('./engine');

exports.getState = (req, res) => {
  res.json({ success: true, data: engine.getState() });
};

exports.start = (req, res) => {
  engine.start();
  res.json({ success: true, message: 'Simulation started', state: engine.getState() });
};

exports.pause = (req, res) => {
  engine.pause();
  res.json({ success: true, message: 'Simulation paused', state: engine.getState() });
};

exports.reset = async (req, res) => {
  await engine.reset();
  res.json({ success: true, message: 'Simulation reset', state: engine.getState() });
};

exports.setSpeed = (req, res) => {
  const { speed } = req.body;
  if (!speed || typeof speed !== 'number') {
    return res.status(400).json({ success: false, message: 'Invalid speed' });
  }
  engine.setSpeed(speed);
  res.json({ success: true, message: `Simulation speed set to ${speed}x`, state: engine.getState() });
};

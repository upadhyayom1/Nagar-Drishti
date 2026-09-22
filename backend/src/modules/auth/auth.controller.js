const { z } = require('zod');
const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
const { env } = require('../../config/env');

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password is too short'),
});

const login = async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const { user, token } = await authService.login(username, password);

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else if (error.message === 'Invalid username or password') {
      res.status(401).json({ success: false, message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};

const me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
};


const wsToken = (req, res) => {
  const token = jwt.sign(
    { sub: req.user.id, role: req.user.role, type: 'websocket' },
    env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  res.status(200).json({ success: true, data: { token } });
};

module.exports = { login, logout, me, wsToken };

const { z } = require('zod');
const authService = require('./auth.service');
const { env } = require('../../config/env');

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
});

const loginSchema = z.object({
  // `username` is kept for compatibility with existing API clients.
  identifier: z.string().trim().min(1, 'Username, email, or phone is required').optional(),
  username: z.string().trim().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => Boolean(data.identifier || data.username), {
  message: 'Username, email, or phone is required',
  path: ['identifier'],
});

const tokenCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};

const login = async (req, res) => {
  try {
    const { identifier, username, password } = loginSchema.parse(req.body);

    const { user, token } = await authService.login(identifier || username, password);

    res.cookie('token', token, {
      ...tokenCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: serializeUser(user),
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
  res.clearCookie('token', tokenCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
});

const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const { user, token } = await authService.register(data);

    res.cookie('token', token, {
      ...tokenCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: serializeUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
    } else if (error.message === 'Username already in use' || error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Username or email is already in use' });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, logout, register, me };

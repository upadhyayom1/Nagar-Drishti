const { prisma } = require('../../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

const login = async (identifier, passwordPlain) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier },
        { phone: identifier },
      ],
    },
  });

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);

  if (!isMatch) {
    throw new Error('Invalid username or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { user, token };
};

const register = async (data) => {
  const existingUser = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existingUser) {
    throw new Error('Username already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email || null,
      passwordHash,
      name: data.name,
      phone: data.phone,
      role: 'USER', // Default to USER role
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return { user, token };
};

const getUserById = async (id) => prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    username: true,
    email: true,
    name: true,
    phone: true,
    role: true,
  },
});

module.exports = { login, register, getUserById };

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Reasonable default token lifetime (24 hours)
const JWT_EXPIRES_IN = '24h';

/**
 * Generate a signed JWT for the authenticated user.
 * Signing key is read strictly from process.env.JWT_SECRET.
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign({ id: userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email format check
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password with bcryptjs (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    const token = generateToken(user._id);

    // Return safe user details only (never passwordHash)
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user and get JWT
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!password || typeof password !== 'string' || password === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Select passwordHash explicitly as it is excluded by default
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    // Return safe user information only
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/logout
// @desc    Logout user (stateless - client discards JWT)
// @access  Public
export const logout = async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully. Please clear your authentication token.' });
};

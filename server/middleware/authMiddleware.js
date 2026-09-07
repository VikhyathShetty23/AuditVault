import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect private routes using Bearer JWT authentication.
 * Sets req.user upon successful validation.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]?.trim();
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('Missing JWT_SECRET environment variable.');
    return res.status(500).json({ message: 'Internal server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid or malformed authentication token.' });
  }
};

export default protect;

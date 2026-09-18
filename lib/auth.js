const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Create JWT token
function createToken(adminId) {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Middleware for protected routes
function withAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      req.adminId = decoded.adminId;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

module.exports = {
  createToken,
  verifyToken,
  hashPassword,
  comparePassword,
  withAuth,
};

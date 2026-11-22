const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');
const { query } = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Invalid or expired authentication token. Please log in again.', 401);
    }

    // Verify user exists in PostgreSQL database
    const userRes = await query(
      `SELECT id, name, email, role, student_id, avatar, created_at FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'User account no longer exists.', 401);
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed.', 500);
  }
};

module.exports = {
  authenticate,
};

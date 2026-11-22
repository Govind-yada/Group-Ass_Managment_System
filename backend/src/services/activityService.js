const crypto = require('crypto');
const { query } = require('../db');

const logActivity = async (userId, action, details) => {
  try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO activity_logs (id, user_id, action, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, userId || null, action, typeof details === 'object' ? JSON.stringify(details) : details]
    );
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

const getRecentActivities = async (limit = 10) => {
  const res = await query(
    `SELECT a.id, a.action, a.details, a.created_at,
            u.name as user_name, u.email as user_email, u.role as user_role, u.avatar as user_avatar
     FROM activity_logs a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
};

module.exports = {
  logActivity,
  getRecentActivities,
};

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../db');
const { generateToken } = require('../utils/jwt');
const { logActivity } = require('./activityService');

const registerStudent = async ({ name, email, password, studentId }) => {
  // Check if email already exists
  const existingEmail = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (existingEmail.rows.length > 0) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Check if studentId already exists
  const existingStudentId = await query('SELECT id FROM users WHERE LOWER(student_id) = LOWER($1)', [studentId]);
  if (existingStudentId.rows.length > 0) {
    const error = new Error('A student with this Student ID is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = crypto.randomUUID();

  await query(
    `INSERT INTO users (id, name, email, password_hash, role, student_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'STUDENT', $5, NOW(), NOW())`,
    [userId, name.trim(), email.toLowerCase().trim(), passwordHash, studentId.trim()]
  );

  await logActivity(userId, 'USER_REGISTERED', `Student registered: ${name} (${studentId})`);

  const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role: 'STUDENT' });

  return {
    user: {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'STUDENT',
      student_id: studentId.trim(),
      avatar: null,
      group: null,
    },
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const userRes = await query(
    `SELECT id, name, email, password_hash, role, student_id, avatar, created_at
     FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (userRes.rows.length === 0) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const user = userRes.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Fetch group information for this user
  const groupRes = await query(
    `SELECT g.id, g.name, g.code, g.leader_id, g.max_members,
            (g.leader_id = $1) as is_leader
     FROM group_members gm
     JOIN groups g ON gm.group_id = g.id
     WHERE gm.user_id = $1`,
    [user.id]
  );

  const group = groupRes.rows.length > 0 ? groupRes.rows[0] : null;

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  delete user.password_hash;
  user.group = group;

  await logActivity(user.id, 'USER_LOGIN', `${user.name} logged in`);

  return {
    user,
    token,
  };
};

const getCurrentUser = async (userId) => {
  const userRes = await query(
    `SELECT id, name, email, role, student_id, avatar, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const user = userRes.rows[0];

  // Fetch group details including members if in group
  const groupRes = await query(
    `SELECT g.id, g.name, g.code, g.leader_id, g.max_members,
            (g.leader_id = $1) as is_leader
     FROM group_members gm
     JOIN groups g ON gm.group_id = g.id
     WHERE gm.user_id = $1`,
    [user.id]
  );

  let group = null;
  if (groupRes.rows.length > 0) {
    group = groupRes.rows[0];
    const membersRes = await query(
      `SELECT u.id, u.name, u.email, u.student_id, u.avatar, gm.joined_at,
              (g.leader_id = u.id) as is_leader
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       JOIN groups g ON gm.group_id = g.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [group.id]
    );
    group.members = membersRes.rows;
  }

  user.group = group;
  return user;
};

const updateProfile = async (userId, { name, avatar, currentPassword, newPassword }) => {
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
  if (userRes.rows.length === 0) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const user = userRes.rows[0];

  if (newPassword) {
    if (!currentPassword) {
      const error = new Error('Current password is required to set a new password.');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const error = new Error('Incorrect current password.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
      passwordHash,
      userId,
    ]);
  }

  if (name !== undefined || avatar !== undefined) {
    await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           avatar = COALESCE($2, avatar),
           updated_at = NOW()
       WHERE id = $3`,
      [name ? name.trim() : null, avatar !== undefined ? avatar : null, userId]
    );
  }

  return getCurrentUser(userId);
};

module.exports = {
  registerStudent,
  loginUser,
  getCurrentUser,
  updateProfile,
};

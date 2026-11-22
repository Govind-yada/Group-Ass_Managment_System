const crypto = require('crypto');
const { query } = require('../db');
const { logActivity } = require('./activityService');

const generateGroupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GRP-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createGroup = async (user, { name, maxMembers = 5 }) => {
  if (user.role !== 'STUDENT') {
    const error = new Error('Only students can create student groups.');
    error.statusCode = 403;
    throw error;
  }

  // Check if student already belongs to any group
  const existingMembership = await query('SELECT group_id FROM group_members WHERE user_id = $1', [
    user.id,
  ]);

  if (existingMembership.rows.length > 0) {
    const error = new Error(
      'You are already a member of a group. The system enforces a strict one-group-per-student policy.'
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if group name is taken
  const existingName = await query('SELECT id FROM groups WHERE LOWER(name) = LOWER($1)', [name]);
  if (existingName.rows.length > 0) {
    const error = new Error('A group with this name already exists. Please choose a different name.');
    error.statusCode = 409;
    throw error;
  }

  const groupId = crypto.randomUUID();
  let code = generateGroupCode();

  // Ensure unique code
  let codeExists = await query('SELECT id FROM groups WHERE code = $1', [code]);
  while (codeExists.rows.length > 0) {
    code = generateGroupCode();
    codeExists = await query('SELECT id FROM groups WHERE code = $1', [code]);
  }

  // Create group
  await query(
    `INSERT INTO groups (id, name, code, leader_id, max_members, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [groupId, name.trim(), code, user.id, maxMembers]
  );

  // Add leader as first member
  const memberId = crypto.randomUUID();
  await query(
    `INSERT INTO group_members (id, group_id, user_id, joined_at)
     VALUES ($1, $2, $3, NOW())`,
    [memberId, groupId, user.id]
  );

  // Create pending submissions for all current assignments with target_type = 'ALL'
  const allAssignments = await query(`SELECT id FROM assignments WHERE target_type = 'ALL'`);
  for (const assign of allAssignments.rows) {
    await query(
      `INSERT INTO submissions (id, assignment_id, group_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
       ON CONFLICT (assignment_id, group_id) DO NOTHING`,
      [crypto.randomUUID(), assign.id, groupId]
    );
  }

  await logActivity(user.id, 'GROUP_CREATED', `${user.name} created group "${name.trim()}" (${code})`);

  return getGroupById(groupId, user.id);
};

const getGroupById = async (groupId, currentUserId) => {
  const groupRes = await query(
    `SELECT g.id, g.name, g.code, g.leader_id, g.max_members, g.created_at, g.updated_at,
            u.name as leader_name, u.email as leader_email, u.student_id as leader_student_id, u.avatar as leader_avatar
     FROM groups g
     JOIN users u ON g.leader_id = u.id
     WHERE g.id = $1`,
    [groupId]
  );

  if (groupRes.rows.length === 0) {
    const error = new Error('Group not found.');
    error.statusCode = 404;
    throw error;
  }

  const group = groupRes.rows[0];

  // Fetch all members
  const membersRes = await query(
    `SELECT u.id, u.name, u.email, u.student_id, u.avatar, gm.joined_at,
            (g.leader_id = u.id) as is_leader
     FROM group_members gm
     JOIN users u ON gm.user_id = u.id
     JOIN groups g ON gm.group_id = g.id
     WHERE gm.group_id = $1
     ORDER BY (g.leader_id = u.id) DESC, gm.joined_at ASC`,
    [groupId]
  );

  group.members = membersRes.rows;
  group.member_count = membersRes.rows.length;
  group.is_leader = group.leader_id === currentUserId;
  group.is_member = membersRes.rows.some((m) => m.id === currentUserId);

  // Fetch group submission statistics
  const subStats = await query(
    `SELECT
       COUNT(*)::int as total_assigned,
       COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END)::int as completed_count,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending_count
     FROM (
       SELECT a.id, COALESCE(s.status, 'PENDING') as status
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
       WHERE a.target_type = 'ALL'
          OR a.id IN (SELECT assignment_id FROM assignment_groups WHERE group_id = $1)
     ) q`,
    [groupId]
  );

  const stats = subStats.rows[0] || { total_assigned: 0, completed_count: 0, pending_count: 0 };
  group.stats = {
    totalAssigned: stats.total_assigned,
    completed: stats.completed_count,
    pending: stats.pending_count,
    completionPercentage:
      stats.total_assigned > 0 ? Math.round((stats.completed_count / stats.total_assigned) * 100) : 0,
  };

  return group;
};

const getMyGroup = async (userId) => {
  const memberRes = await query('SELECT group_id FROM group_members WHERE user_id = $1', [userId]);

  if (memberRes.rows.length === 0) {
    return null;
  }

  return getGroupById(memberRes.rows[0].group_id, userId);
};

const addMember = async (groupId, { identifier }, currentUser) => {
  const group = await getGroupById(groupId, currentUser.id);

  // Authorization check: Only group leader or Admin can add members
  if (currentUser.role !== 'ADMIN' && group.leader_id !== currentUser.id) {
    const error = new Error('Permission denied. Only the group leader can add members.');
    error.statusCode = 403;
    throw error;
  }

  // Capacity check
  if (group.members.length >= group.max_members) {
    const error = new Error(`Group has reached its maximum capacity of ${group.max_members} members.`);
    error.statusCode = 400;
    throw error;
  }

  // Lookup student by email or student_id
  const targetUserRes = await query(
    `SELECT id, name, email, student_id, role
     FROM users
     WHERE (LOWER(email) = LOWER($1) OR LOWER(student_id) = LOWER($1))`,
    [identifier.trim()]
  );

  if (targetUserRes.rows.length === 0) {
    const error = new Error(`No registered student found with email or ID "${identifier}".`);
    error.statusCode = 404;
    throw error;
  }

  const targetUser = targetUserRes.rows[0];

  if (targetUser.role !== 'STUDENT') {
    const error = new Error('Only registered students can be added to project groups.');
    error.statusCode = 400;
    throw error;
  }

  // Check if target user is already in a group
  const existingMembership = await query(
    `SELECT gm.group_id, g.name as group_name
     FROM group_members gm
     JOIN groups g ON gm.group_id = g.id
     WHERE gm.user_id = $1`,
    [targetUser.id]
  );

  if (existingMembership.rows.length > 0) {
    const mem = existingMembership.rows[0];
    if (mem.group_id === groupId) {
      const error = new Error(`${targetUser.name} is already a member of this group.`);
      error.statusCode = 400;
      throw error;
    } else {
      const error = new Error(
        `${targetUser.name} is already a member of group "${mem.group_name}". Each student can belong to only one group.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Insert member
  await query(
    `INSERT INTO group_members (id, group_id, user_id, joined_at)
     VALUES ($1, $2, $3, NOW())`,
    [crypto.randomUUID(), groupId, targetUser.id]
  );

  await logActivity(
    currentUser.id,
    'MEMBER_ADDED',
    `${currentUser.name} added ${targetUser.name} (${targetUser.student_id}) to ${group.name}`
  );

  return getGroupById(groupId, currentUser.id);
};

const removeMember = async (groupId, targetUserId, currentUser) => {
  const group = await getGroupById(groupId, currentUser.id);

  // Check if target user is in the group
  const isTargetInGroup = group.members.some((m) => m.id === targetUserId);
  if (!isTargetInGroup) {
    const error = new Error('The specified user is not a member of this group.');
    error.statusCode = 404;
    throw error;
  }

  // If student is removing themselves (leaving group)
  const isLeavingSelf = targetUserId === currentUser.id;

  // Authorization check: Leader can remove members; user can leave themselves; Admin can remove anyone
  if (!isLeavingSelf && group.leader_id !== currentUser.id && currentUser.role !== 'ADMIN') {
    const error = new Error('Permission denied. Only the group leader can remove members.');
    error.statusCode = 403;
    throw error;
  }

  // Group leader cannot simply leave if other members remain (must disband or transfer)
  if (group.leader_id === targetUserId) {
    if (group.members.length > 1) {
      const error = new Error(
        'As the group leader, you cannot leave the group while members remain. Please disband the group or remove all members first.'
      );
      error.statusCode = 400;
      throw error;
    } else {
      // Sole member leaving = delete/disband group
      await query('DELETE FROM groups WHERE id = $1', [groupId]);
      await logActivity(currentUser.id, 'GROUP_DISBANDED', `${currentUser.name} disbanded group "${group.name}"`);
      return { disbanded: true, message: 'Group was successfully disbanded.' };
    }
  }

  // Remove member
  await query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);

  const targetMember = group.members.find((m) => m.id === targetUserId);
  await logActivity(
    currentUser.id,
    'MEMBER_REMOVED',
    `${currentUser.name} removed ${targetMember?.name || 'student'} from ${group.name}`
  );

  return getGroupById(groupId, currentUser.id);
};

const listAllGroups = async ({ search = '', limit = 50, offset = 0 } = {}) => {
  let sql = `
    SELECT g.id, g.name, g.code, g.leader_id, g.max_members, g.created_at,
           u.name as leader_name, u.email as leader_email, u.student_id as leader_student_id,
           COUNT(gm.id)::int as member_count
    FROM groups g
    JOIN users u ON g.leader_id = u.id
    LEFT JOIN group_members gm ON g.id = gm.group_id
  `;

  const params = [];
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    sql += ` WHERE LOWER(g.name) LIKE $1 OR LOWER(g.code) LIKE $1 OR LOWER(u.name) LIKE $1 `;
  }

  sql += `
    GROUP BY g.id, u.name, u.email, u.student_id
    ORDER BY g.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  const res = await query(sql, params);
  return res.rows;
};

module.exports = {
  createGroup,
  getGroupById,
  getMyGroup,
  addMember,
  removeMember,
  listAllGroups,
};

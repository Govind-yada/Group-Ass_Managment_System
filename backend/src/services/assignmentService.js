const crypto = require('crypto');
const { query } = require('../db');
const { logActivity } = require('./activityService');

const getAssignmentsForUser = async (user, { statusFilter, search } = {}) => {
  if (user.role === 'ADMIN') {
    // Admin sees all assignments with aggregated submission metrics
    let sql = `
      SELECT a.id, a.title, a.description, a.due_date, a.onedrive_url, a.target_type, a.created_at,
             u.name as creator_name,
             COUNT(DISTINCT g.id)::int as total_groups_assigned,
             COUNT(DISTINCT CASE WHEN s.status = 'SUBMITTED' THEN s.group_id END)::int as submitted_count,
             COUNT(DISTINCT CASE WHEN s.status = 'PENDING' OR s.status IS NULL THEN g.id END)::int as pending_count
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN groups g ON (
        a.target_type = 'ALL' OR
        g.id IN (SELECT ag.group_id FROM assignment_groups ag WHERE ag.assignment_id = a.id)
      )
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
    `;

    const params = [];
    const whereConditions = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereConditions.push(`(LOWER(a.title) LIKE $${params.length} OR LOWER(a.description) LIKE $${params.length})`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ` + whereConditions.join(' AND ');
    }

    sql += `
      GROUP BY a.id, u.name
      ORDER BY a.due_date ASC
    `;

    const res = await query(sql, params);
    return res.rows.map((row) => ({
      ...row,
      is_overdue: new Date(row.due_date) < new Date(),
      completion_percentage:
        row.total_groups_assigned > 0
          ? Math.round((row.submitted_count / row.total_groups_assigned) * 100)
          : 0,
    }));
  }

  // Student perspective
  // 1. Find student's group
  const memberRes = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [user.id]);
  const groupId = memberRes.rows.length > 0 ? memberRes.rows[0].group_id : null;

  let sql = `
    SELECT a.id, a.title, a.description, a.due_date, a.onedrive_url, a.target_type, a.created_at,
           u.name as creator_name,
           s.id as submission_id,
           COALESCE(s.status, 'PENDING') as submission_status,
           s.submitted_at,
           s.notes as submission_notes,
           sub_user.name as submitted_by_name,
           sub_user.student_id as submitted_by_student_id
    FROM assignments a
    JOIN users u ON a.created_by = u.id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
    LEFT JOIN users sub_user ON s.submitted_by = sub_user.id
    WHERE (
      a.target_type = 'ALL'
      ${groupId ? `OR a.id IN (SELECT ag.assignment_id FROM assignment_groups ag WHERE ag.group_id = $1)` : ''}
    )
  `;

  const params = [groupId];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    sql += ` AND (LOWER(a.title) LIKE $${params.length} OR LOWER(a.description) LIKE $${params.length}) `;
  }

  if (statusFilter && (statusFilter === 'SUBMITTED' || statusFilter === 'PENDING')) {
    params.push(statusFilter);
    sql += ` AND COALESCE(s.status, 'PENDING') = $${params.length} `;
  }

  sql += ` ORDER BY a.due_date ASC `;

  const res = await query(sql, params);
  return res.rows.map((row) => ({
    ...row,
    is_overdue: new Date(row.due_date) < new Date(),
    has_group: !!groupId,
  }));
};

const getAssignmentById = async (assignmentId, user) => {
  const assignRes = await query(
    `SELECT a.id, a.title, a.description, a.due_date, a.onedrive_url, a.target_type, a.created_at, a.updated_at,
            u.name as creator_name, u.email as creator_email
     FROM assignments a
     JOIN users u ON a.created_by = u.id
     WHERE a.id = $1`,
    [assignmentId]
  );

  if (assignRes.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  const assignment = assignRes.rows[0];
  assignment.is_overdue = new Date(assignment.due_date) < new Date();

  // If Admin: fetch all assigned groups and detailed submission statuses
  if (user.role === 'ADMIN') {
    const groupsRes = await query(
      `SELECT g.id as group_id, g.name as group_name, g.code as group_code,
              leader.name as leader_name,
              s.id as submission_id,
              COALESCE(s.status, 'PENDING') as status,
              s.submitted_at,
              s.notes,
              sub_user.name as submitted_by_name,
              sub_user.student_id as submitted_by_student_id
       FROM groups g
       JOIN users leader ON g.leader_id = leader.id
       LEFT JOIN submissions s ON s.assignment_id = $1 AND s.group_id = g.id
       LEFT JOIN users sub_user ON s.submitted_by = sub_user.id
       WHERE (
         $2 = 'ALL' OR
         g.id IN (SELECT ag.group_id FROM assignment_groups ag WHERE ag.assignment_id = $1)
       )
       ORDER BY g.name ASC`,
      [assignmentId, assignment.target_type]
    );

    // Fetch members for each group
    for (const g of groupsRes.rows) {
      const mRes = await query(
        `SELECT u.name, u.email, u.student_id
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1`,
        [g.group_id]
      );
      g.members = mRes.rows;
    }

    assignment.assigned_groups = groupsRes.rows;
    const submittedCount = groupsRes.rows.filter((g) => g.status === 'SUBMITTED').length;
    assignment.stats = {
      totalGroups: groupsRes.rows.length,
      submittedGroups: submittedCount,
      pendingGroups: groupsRes.rows.length - submittedCount,
      completionPercentage:
        groupsRes.rows.length > 0 ? Math.round((submittedCount / groupsRes.rows.length) * 100) : 0,
    };

    return assignment;
  }

  // If Student: fetch student's group submission status
  const memberRes = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [user.id]);
  const groupId = memberRes.rows.length > 0 ? memberRes.rows[0].group_id : null;

  if (groupId) {
    const subRes = await query(
      `SELECT s.id, s.status, s.submitted_at, s.notes,
              u.name as submitted_by_name, u.student_id as submitted_by_student_id
       FROM submissions s
       LEFT JOIN users u ON s.submitted_by = u.id
       WHERE s.assignment_id = $1 AND s.group_id = $2`,
      [assignmentId, groupId]
    );

    if (subRes.rows.length > 0) {
      assignment.submission = subRes.rows[0];
    } else {
      assignment.submission = {
        status: 'PENDING',
        submitted_at: null,
        submitted_by_name: null,
      };
    }

    // Get group info
    const gInfo = await query(`SELECT id, name, code FROM groups WHERE id = $1`, [groupId]);
    assignment.student_group = gInfo.rows[0];
  } else {
    assignment.student_group = null;
    assignment.submission = null;
  }

  return assignment;
};

const createAssignment = async (data, adminUser) => {
  const { title, description, dueDate, onedriveUrl, targetType = 'ALL', assignedGroupIds = [] } = data;

  const assignmentId = crypto.randomUUID();

  await query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_url, target_type, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [assignmentId, title.trim(), description.trim(), new Date(dueDate), onedriveUrl.trim(), targetType, adminUser.id]
  );

  // Link specific groups if targeted
  if (targetType === 'GROUPS' && Array.isArray(assignedGroupIds) && assignedGroupIds.length > 0) {
    for (const gId of assignedGroupIds) {
      await query(
        `INSERT INTO assignment_groups (id, assignment_id, group_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (assignment_id, group_id) DO NOTHING`,
        [crypto.randomUUID(), assignmentId, gId]
      );

      // Create pending submission record
      await query(
        `INSERT INTO submissions (id, assignment_id, group_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
         ON CONFLICT (assignment_id, group_id) DO NOTHING`,
        [crypto.randomUUID(), assignmentId, gId]
      );
    }
  } else if (targetType === 'ALL') {
    // Create pending submission records for all existing groups
    const allGroups = await query(`SELECT id FROM groups`);
    for (const g of allGroups.rows) {
      await query(
        `INSERT INTO submissions (id, assignment_id, group_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
         ON CONFLICT (assignment_id, group_id) DO NOTHING`,
        [crypto.randomUUID(), assignmentId, g.id]
      );
    }
  }

  await logActivity(
    adminUser.id,
    'ASSIGNMENT_CREATED',
    `${adminUser.name} created assignment "${title.trim()}" (Due: ${new Date(dueDate).toLocaleDateString()})`
  );

  return getAssignmentById(assignmentId, adminUser);
};

const updateAssignment = async (id, data, adminUser) => {
  const existing = await query(`SELECT * FROM assignments WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  const { title, description, dueDate, onedriveUrl, targetType, assignedGroupIds } = data;

  await query(
    `UPDATE assignments
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         due_date = COALESCE($3, due_date),
         onedrive_url = COALESCE($4, onedrive_url),
         target_type = COALESCE($5, target_type),
         updated_at = NOW()
     WHERE id = $6`,
    [
      title ? title.trim() : null,
      description ? description.trim() : null,
      dueDate ? new Date(dueDate) : null,
      onedriveUrl ? onedriveUrl.trim() : null,
      targetType || null,
      id,
    ]
  );

  // If assigned groups provided for GROUPS target
  if (targetType === 'GROUPS' && Array.isArray(assignedGroupIds)) {
    // Delete groups no longer assigned
    await query(`DELETE FROM assignment_groups WHERE assignment_id = $1 AND group_id != ALL($2)`, [
      id,
      assignedGroupIds,
    ]);

    for (const gId of assignedGroupIds) {
      await query(
        `INSERT INTO assignment_groups (id, assignment_id, group_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (assignment_id, group_id) DO NOTHING`,
        [crypto.randomUUID(), id, gId]
      );

      await query(
        `INSERT INTO submissions (id, assignment_id, group_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
         ON CONFLICT (assignment_id, group_id) DO NOTHING`,
        [crypto.randomUUID(), id, gId]
      );
    }
  }

  await logActivity(adminUser.id, 'ASSIGNMENT_UPDATED', `${adminUser.name} updated assignment "${title || existing.rows[0].title}"`);

  return getAssignmentById(id, adminUser);
};

const deleteAssignment = async (id, adminUser) => {
  const existing = await query(`SELECT * FROM assignments WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  await query(`DELETE FROM assignments WHERE id = $1`, [id]);
  await logActivity(
    adminUser.id,
    'ASSIGNMENT_DELETED',
    `${adminUser.name} deleted assignment "${existing.rows[0].title}"`
  );

  return { id, message: 'Assignment deleted successfully.' };
};

module.exports = {
  getAssignmentsForUser,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};

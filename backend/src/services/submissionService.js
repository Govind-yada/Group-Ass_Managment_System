const crypto = require('crypto');
const { query } = require('../db');
const { logActivity } = require('./activityService');

const confirmSubmission = async (assignmentId, { notes }, currentUser) => {
  // 1. Verify student role
  if (currentUser.role !== 'STUDENT') {
    const error = new Error('Only students can confirm group assignment submissions.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Verify student belongs to a group
  const memberRes = await query(
    `SELECT gm.group_id, g.name as group_name
     FROM group_members gm
     JOIN groups g ON gm.group_id = g.id
     WHERE gm.user_id = $1`,
    [currentUser.id]
  );

  if (memberRes.rows.length === 0) {
    const error = new Error('You must be a member of a group to submit assignments. Please create or join a group first.');
    error.statusCode = 400;
    throw error;
  }

  const { group_id: groupId, group_name: groupName } = memberRes.rows[0];

  // 3. Verify assignment exists
  const assignRes = await query(`SELECT id, title, target_type, due_date FROM assignments WHERE id = $1`, [
    assignmentId,
  ]);

  if (assignRes.rows.length === 0) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  const assignment = assignRes.rows[0];

  // 4. Verify assignment is targeted to this group
  if (assignment.target_type !== 'ALL') {
    const targeted = await query(
      `SELECT id FROM assignment_groups WHERE assignment_id = $1 AND group_id = $2`,
      [assignmentId, groupId]
    );

    if (targeted.rows.length === 0) {
      const error = new Error('This assignment has not been assigned to your group.');
      error.statusCode = 403;
      throw error;
    }
  }

  // 5. Check if already submitted (Prevent duplicate confirmations)
  const existingSub = await query(
    `SELECT s.id, s.status, s.submitted_at, u.name as submitted_by_name
     FROM submissions s
     LEFT JOIN users u ON s.submitted_by = u.id
     WHERE s.assignment_id = $1 AND s.group_id = $2`,
    [assignmentId, groupId]
  );

  if (existingSub.rows.length > 0 && existingSub.rows[0].status === 'SUBMITTED') {
    const prev = existingSub.rows[0];
    const error = new Error(
      `Submission already confirmed by ${prev.submitted_by_name || 'a group member'} on ${new Date(
        prev.submitted_at
      ).toLocaleString()}. Duplicate submissions are prevented.`
    );
    error.statusCode = 400;
    throw error;
  }

  const submissionNotes = notes ? notes.trim() : 'Declared and confirmed OneDrive file upload.';

  // 6. Record submission in PostgreSQL
  let subId;
  if (existingSub.rows.length > 0) {
    subId = existingSub.rows[0].id;
    await query(
      `UPDATE submissions
       SET status = 'SUBMITTED',
           submitted_by = $1,
           submitted_at = NOW(),
           notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [currentUser.id, submissionNotes, subId]
    );
  } else {
    subId = crypto.randomUUID();
    await query(
      `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
       VALUES ($1, $2, $3, 'SUBMITTED', $4, NOW(), $5, NOW(), NOW())`,
      [subId, assignmentId, groupId, currentUser.id, submissionNotes]
    );
  }

  // 7. Audit log activity
  await logActivity(
    currentUser.id,
    'SUBMISSION_CONFIRMED',
    `${currentUser.name} declared OneDrive submission for "${assignment.title}" on behalf of group "${groupName}"`
  );

  // 8. Fetch updated submission details with group statistics
  const updatedRes = await query(
    `SELECT s.id, s.status, s.submitted_at, s.notes,
            u.name as submitted_by_name, u.email as submitted_by_email, u.student_id as submitted_by_student_id,
            a.title as assignment_title, a.due_date,
            g.name as group_name, g.code as group_code
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN groups g ON s.group_id = g.id
     LEFT JOIN users u ON s.submitted_by = u.id
     WHERE s.id = $1`,
    [subId]
  );

  return updatedRes.rows[0];
};

const getSubmissionStatus = async (assignmentId, currentUser) => {
  const memberRes = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [currentUser.id]);
  if (memberRes.rows.length === 0) {
    return { status: 'PENDING', has_group: false };
  }

  const groupId = memberRes.rows[0].group_id;
  const res = await query(
    `SELECT s.id, s.status, s.submitted_at, s.notes,
            u.name as submitted_by_name, u.student_id as submitted_by_student_id
     FROM submissions s
     LEFT JOIN users u ON s.submitted_by = u.id
     WHERE s.assignment_id = $1 AND s.group_id = $2`,
    [assignmentId, groupId]
  );

  if (res.rows.length === 0) {
    return { status: 'PENDING', has_group: true };
  }

  return { ...res.rows[0], has_group: true };
};

const getStudentSubmissionHistory = async (currentUser) => {
  const memberRes = await query(`SELECT group_id FROM group_members WHERE user_id = $1`, [currentUser.id]);
  if (memberRes.rows.length === 0) {
    return [];
  }

  const groupId = memberRes.rows[0].group_id;
  const res = await query(
    `SELECT s.id, s.status, s.submitted_at, s.notes,
            a.id as assignment_id, a.title as assignment_title, a.due_date, a.onedrive_url,
            u.name as submitted_by_name, u.student_id as submitted_by_student_id
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     LEFT JOIN users u ON s.submitted_by = u.id
     WHERE s.group_id = $1 AND s.status = 'SUBMITTED'
     ORDER BY s.submitted_at DESC`,
    [groupId]
  );

  return res.rows;
};

module.exports = {
  confirmSubmission,
  getSubmissionStatus,
  getStudentSubmissionHistory,
};

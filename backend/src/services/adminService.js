const { query } = require('../db');
const { getRecentActivities } = require('./activityService');

const getAdminDashboardStats = async () => {
  // Total registered students
  const studentsCountRes = await query(`SELECT COUNT(*)::int as count FROM users WHERE role = 'STUDENT'`);
  const totalStudents = studentsCountRes.rows[0].count;

  // Total groups
  const groupsCountRes = await query(`SELECT COUNT(*)::int as count FROM groups`);
  const totalGroups = groupsCountRes.rows[0].count;

  // Total assignments
  const assignmentsCountRes = await query(`SELECT COUNT(*)::int as count FROM assignments`);
  const totalAssignments = assignmentsCountRes.rows[0].count;

  // Submissions stats
  const subStatsRes = await query(`
    SELECT
      COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END)::int as completed,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending,
      COUNT(*)::int as total
    FROM submissions
  `);
  const completedSubmissions = subStatsRes.rows[0].completed || 0;
  const pendingSubmissions = subStatsRes.rows[0].pending || 0;
  const totalSubmissions = completedSubmissions + pendingSubmissions;

  const overallCompletionRate =
    totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

  // Upcoming deadlines (next 5)
  const upcomingDeadlinesRes = await query(`
    SELECT id, title, due_date, onedrive_url, target_type
    FROM assignments
    WHERE due_date >= NOW()
    ORDER BY due_date ASC
    LIMIT 5
  `);

  // Recent activities
  const recentActivities = await getRecentActivities(8);

  return {
    summary: {
      totalStudents,
      totalGroups,
      totalAssignments,
      completedSubmissions,
      pendingSubmissions,
      overallCompletionRate,
    },
    upcomingDeadlines: upcomingDeadlinesRes.rows,
    recentActivities,
  };
};

const getAdminAnalytics = async () => {
  // 1. Assignment submission breakdown (for BarChart)
  const assignBreakdownRes = await query(`
    SELECT a.id, a.title,
           COUNT(s.id)::int as total_groups,
           COUNT(CASE WHEN s.status = 'SUBMITTED' THEN 1 END)::int as submitted,
           COUNT(CASE WHEN s.status = 'PENDING' THEN 1 END)::int as pending
    FROM assignments a
    LEFT JOIN submissions s ON s.assignment_id = a.id
    GROUP BY a.id, a.title
    ORDER BY a.created_at ASC
  `);

  const assignmentStats = assignBreakdownRes.rows.map((row) => ({
    name: row.title.length > 25 ? row.title.substring(0, 22) + '...' : row.title,
    fullTitle: row.title,
    assigned: row.total_groups,
    submitted: row.submitted,
    pending: row.pending,
    completionRate: row.total_groups > 0 ? Math.round((row.submitted / row.total_groups) * 100) : 0,
  }));

  // 2. Group progress comparison (for Horizontal BarChart)
  const groupProgressRes = await query(`
    SELECT g.id, g.name, g.code,
           COUNT(s.id)::int as total_assigned,
           COUNT(CASE WHEN s.status = 'SUBMITTED' THEN 1 END)::int as completed,
           COUNT(CASE WHEN s.status = 'PENDING' THEN 1 END)::int as pending
    FROM groups g
    LEFT JOIN submissions s ON s.group_id = g.id
    GROUP BY g.id, g.name, g.code
    ORDER BY completed DESC
  `);

  const groupProgress = groupProgressRes.rows.map((row) => ({
    name: row.name,
    code: row.code,
    totalAssigned: row.total_assigned,
    completed: row.completed,
    pending: row.pending,
    progress: row.total_assigned > 0 ? Math.round((row.completed / row.total_assigned) * 100) : 0,
  }));

  // 3. Overall submission status distribution (for PieChart)
  const subStatsRes = await query(`
    SELECT
      COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END)::int as submitted,
      COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending
    FROM submissions
  `);
  const pieData = [
    { name: 'Completed Submissions', value: subStatsRes.rows[0].submitted || 0, color: '#10B981' },
    { name: 'Pending Submissions', value: subStatsRes.rows[0].pending || 0, color: '#F59E0B' },
  ];

  // 4. Student participation: students in groups vs students without groups
  const studentDistributionRes = await query(`
    SELECT
      COUNT(DISTINCT gm.user_id)::int as students_in_groups,
      (SELECT COUNT(*)::int FROM users WHERE role = 'STUDENT') - COUNT(DISTINCT gm.user_id)::int as unassigned_students
    FROM group_members gm
  `);

  const studentParticipation = [
    { name: 'In Project Group', value: studentDistributionRes.rows[0].students_in_groups || 0, color: '#6366F1' },
    { name: 'Unassigned Students', value: Math.max(0, studentDistributionRes.rows[0].unassigned_students || 0), color: '#94A3B8' },
  ];

  return {
    assignmentStats,
    groupProgress,
    statusDistribution: pieData,
    studentParticipation,
  };
};

const getSubmissionMonitoring = async ({ search = '', status = '', assignmentId = '' } = {}) => {
  let sql = `
    SELECT
      s.id as submission_id,
      s.status,
      s.submitted_at,
      s.notes,
      a.id as assignment_id,
      a.title as assignment_title,
      a.due_date,
      a.onedrive_url,
      g.id as group_id,
      g.name as group_name,
      g.code as group_code,
      leader.name as leader_name,
      sub_user.name as submitted_by_name,
      sub_user.email as submitted_by_email,
      sub_user.student_id as submitted_by_student_id
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN groups g ON s.group_id = g.id
    JOIN users leader ON g.leader_id = leader.id
    LEFT JOIN users sub_user ON s.submitted_by = sub_user.id
  `;

  const params = [];
  const conditions = [];

  if (assignmentId) {
    params.push(assignmentId);
    conditions.push(`a.id = $${params.length}`);
  }

  if (status && status !== 'ALL') {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    const idx = params.length;
    conditions.push(`(
      LOWER(a.title) LIKE $${idx} OR
      LOWER(g.name) LIKE $${idx} OR
      LOWER(g.code) LIKE $${idx} OR
      LOWER(COALESCE(sub_user.name, '')) LIKE $${idx} OR
      LOWER(COALESCE(sub_user.student_id, '')) LIKE $${idx}
    )`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  sql += ` ORDER BY s.status DESC, s.submitted_at DESC NULLS LAST, a.due_date ASC `;

  const res = await query(sql, params);

  // Fetch members for each group in result
  for (const item of res.rows) {
    const memRes = await query(
      `SELECT u.id, u.name, u.email, u.student_id, (g.leader_id = u.id) as is_leader
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       JOIN groups g ON gm.group_id = g.id
       WHERE gm.group_id = $1
       ORDER BY (g.leader_id = u.id) DESC, u.name ASC`,
      [item.group_id]
    );
    item.group_members = memRes.rows;
    item.is_overdue = new Date(item.due_date) < new Date();
  }

  return res.rows;
};

const getAdminGroups = async ({ search = '' } = {}) => {
  let sql = `
    SELECT g.id, g.name, g.code, g.leader_id, g.max_members, g.created_at,
           u.name as leader_name, u.email as leader_email, u.student_id as leader_student_id,
           COUNT(DISTINCT gm.id)::int as member_count
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
  `;

  const res = await query(sql, params);

  // Fetch members and submission status for each group
  for (const g of res.rows) {
    const memRes = await query(
      `SELECT u.id, u.name, u.email, u.student_id, (g.leader_id = u.id) as is_leader, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       JOIN groups g ON gm.group_id = g.id
       WHERE gm.group_id = $1
       ORDER BY (g.leader_id = u.id) DESC, gm.joined_at ASC`,
      [g.id]
    );
    g.members = memRes.rows;

    const subRes = await query(
      `SELECT
         COUNT(*)::int as total_assigned,
         COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END)::int as completed,
         COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending
       FROM submissions
       WHERE group_id = $1`,
      [g.id]
    );

    const stats = subRes.rows[0] || { total_assigned: 0, completed: 0, pending: 0 };
    g.stats = {
      totalAssigned: stats.total_assigned,
      completed: stats.completed,
      pending: stats.pending,
      completionPercentage:
        stats.total_assigned > 0 ? Math.round((stats.completed / stats.total_assigned) * 100) : 0,
    };
  }

  return res.rows;
};

module.exports = {
  getAdminDashboardStats,
  getAdminAnalytics,
  getSubmissionMonitoring,
  getAdminGroups,
};

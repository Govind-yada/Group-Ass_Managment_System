const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { initDatabase, query } = require('../src/db');
const authService = require('../src/services/authService');
const groupService = require('../src/services/groupService');
const assignmentService = require('../src/services/assignmentService');
const submissionService = require('../src/services/submissionService');
const adminService = require('../src/services/adminService');

describe('Joineazy Backend API Integration & Logic Test Suite', () => {
  let adminUser;
  let studentAlice;
  let testStudentBob;
  let testGroup;
  let testAssignment;

  before(async () => {
    await initDatabase();

    // Fetch seeded admin
    const adminRes = await query(`SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1`);
    adminUser = adminRes.rows[0];

    // Fetch seeded student
    const studentRes = await query(`SELECT * FROM users WHERE email = 'alice@student.joineazy.edu' LIMIT 1`);
    studentAlice = studentRes.rows[0];
  });

  test('1. Auth: Student Login with valid credentials succeeds', async () => {
    const res = await authService.loginUser({
      email: 'alice@student.joineazy.edu',
      password: 'Password@123',
    });

    assert.ok(res.token, 'Token must be issued');
    assert.strictEqual(res.user.email, 'alice@student.joineazy.edu');
    assert.strictEqual(res.user.role, 'STUDENT');
  });

  test('2. Auth: Login with incorrect password throws 401', async () => {
    await assert.rejects(
      async () => {
        await authService.loginUser({
          email: 'alice@student.joineazy.edu',
          password: 'WrongPassword!',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );
  });

  test('3. Auth: Registering duplicate student email throws 409', async () => {
    await assert.rejects(
      async () => {
        await authService.registerStudent({
          name: 'Duplicate Alice',
          email: 'alice@student.joineazy.edu',
          password: 'Password@123',
          studentId: 'UNIQUE999',
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  test('4. Auth: Registering a new student works cleanly', async () => {
    const uniqueEmail = `test_${Date.now()}@student.joineazy.edu`;
    const uniqueStudentId = `ID_${Date.now()}`;

    const res = await authService.registerStudent({
      name: 'Test Candidate',
      email: uniqueEmail,
      password: 'Password@123',
      studentId: uniqueStudentId,
    });

    assert.ok(res.token);
    assert.strictEqual(res.user.email, uniqueEmail);
    testStudentBob = res.user;
  });

  test('5. Groups: Student with existing group cannot create second group (1 group per student)', async () => {
    // Alice is already in Team Alpha
    await assert.rejects(
      async () => {
        await groupService.createGroup(studentAlice, { name: 'Alice Second Group' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('6. Groups: Unassigned student can create a new group', async () => {
    const newGroup = await groupService.createGroup(testStudentBob, {
      name: `Innovators Hub ${Date.now()}`,
      maxMembers: 4,
    });

    assert.ok(newGroup.id);
    assert.strictEqual(newGroup.is_leader, true);
    assert.strictEqual(newGroup.member_count, 1);
    testGroup = newGroup;
  });

  test('7. Assignments: Admin can create targeted assignment', async () => {
    const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const assignment = await assignmentService.createAssignment(
      {
        title: 'Full Stack Deployment Test Assignment',
        description: 'Implement end-to-end continuous integration and deliver OneDrive release archive.',
        dueDate,
        onedriveUrl: 'https://onedrive.live.com/test-academic-deployment',
        targetType: 'GROUPS',
        assignedGroupIds: [testGroup.id],
      },
      adminUser
    );

    assert.ok(assignment.id);
    assert.strictEqual(assignment.title, 'Full Stack Deployment Test Assignment');
    testAssignment = assignment;
  });

  test('8. Submissions: Two-step confirmation declaration records submission in PostgreSQL', async () => {
    const submissionResult = await submissionService.confirmSubmission(
      testAssignment.id,
      { notes: 'Submitted via OneDrive engineering share link' },
      testStudentBob
    );

    assert.strictEqual(submissionResult.status, 'SUBMITTED');
    assert.strictEqual(submissionResult.submitted_by_name, testStudentBob.name);
    assert.ok(submissionResult.submitted_at);
  });

  test('9. Submissions: Duplicate submission confirmation is prevented', async () => {
    await assert.rejects(
      async () => {
        await submissionService.confirmSubmission(
          testAssignment.id,
          { notes: 'Attempting duplicate confirm' },
          testStudentBob
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('10. Admin: Analytics and Dashboard statistics return accurate PostgreSQL aggregations', async () => {
    const stats = await adminService.getAdminDashboardStats();
    assert.ok(stats.summary.totalStudents >= 2);
    assert.ok(stats.summary.totalGroups >= 2);
    assert.ok(stats.summary.totalAssignments >= 1);
    assert.ok(stats.summary.completedSubmissions >= 1);

    const analytics = await adminService.getAdminAnalytics();
    assert.ok(Array.isArray(analytics.assignmentStats));
    assert.ok(Array.isArray(analytics.groupProgress));
    assert.ok(Array.isArray(analytics.statusDistribution));
  });
});

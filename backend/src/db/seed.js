const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { initDatabase, query } = require('./index');

async function seedDatabase() {
  console.log('🌱 Starting database seeding for Joineazy...');
  await initDatabase();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', salt);

  // Clear existing data (in dependency order)
  await query('DELETE FROM activity_logs');
  await query('DELETE FROM submissions');
  await query('DELETE FROM assignment_groups');
  await query('DELETE FROM assignments');
  await query('DELETE FROM group_members');
  await query('DELETE FROM groups');
  await query('DELETE FROM users');

  console.log('🧹 Cleaned existing tables.');

  // 1. Seed Users
  const adminId1 = crypto.randomUUID();
  const adminId2 = crypto.randomUUID();
  const studentId1 = crypto.randomUUID(); // Alice
  const studentId2 = crypto.randomUUID(); // Bob
  const studentId3 = crypto.randomUUID(); // Charlie
  const studentId4 = crypto.randomUUID(); // David
  const studentId5 = crypto.randomUUID(); // Emma
  const studentId6 = crypto.randomUUID(); // Fiona
  const studentId7 = crypto.randomUUID(); // George

  const users = [
    {
      id: adminId1,
      name: 'Prof. Alexander Vance',
      email: 'admin@joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'ADMIN',
      student_id: null,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: adminId2,
      name: 'Dr. Sophia Reynolds',
      email: 'sophia@joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'ADMIN',
      student_id: null,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
    {
      id: studentId1,
      name: 'Alice Johnson',
      email: 'alice@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202601',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      id: studentId2,
      name: 'Bob Smith',
      email: 'bob@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202602',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: studentId3,
      name: 'Charlie Brown',
      email: 'charlie@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202603',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      id: studentId4,
      name: 'David Miller',
      email: 'david@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202604',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    },
    {
      id: studentId5,
      name: 'Emma Watson',
      email: 'emma@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202605',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
    {
      id: studentId6,
      name: 'Fiona Gallagher',
      email: 'fiona@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202606',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    },
    {
      id: studentId7,
      name: 'George Clark',
      email: 'george@student.joineazy.edu',
      password_hash: defaultPasswordHash,
      role: 'STUDENT',
      student_id: 'CS202607',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, student_id, avatar, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [u.id, u.name, u.email, u.password_hash, u.role, u.student_id, u.avatar]
    );
  }
  console.log(` Created ${users.length} seeded users.`);

  // 2. Seed Groups
  const groupId1 = crypto.randomUUID();
  const groupId2 = crypto.randomUUID();

  await query(
    `INSERT INTO groups (id, name, code, leader_id, max_members, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [groupId1, 'Team Alpha', 'GRP-ALPHA', studentId1, 5]
  );

  await query(
    `INSERT INTO groups (id, name, code, leader_id, max_members, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [groupId2, 'Byte Builders', 'GRP-BYTE', studentId4, 5]
  );

  console.log(' Created sample groups: Team Alpha & Byte Builders.');

  // 3. Seed Group Members
  // Group 1 Members: Alice (Leader), Bob, Charlie
  const group1Members = [studentId1, studentId2, studentId3];
  for (const uid of group1Members) {
    await query(
      `INSERT INTO group_members (id, group_id, user_id, joined_at)
       VALUES ($1, $2, $3, NOW())`,
      [crypto.randomUUID(), groupId1, uid]
    );
  }

  // Group 2 Members: David (Leader), Emma
  const group2Members = [studentId4, studentId5];
  for (const uid of group2Members) {
    await query(
      `INSERT INTO group_members (id, group_id, user_id, joined_at)
       VALUES ($1, $2, $3, NOW())`,
      [crypto.randomUUID(), groupId2, uid]
    );
  }
  console.log(' Assigned group members to groups.');

  // 4. Seed Assignments
  const assignId1 = crypto.randomUUID();
  const assignId2 = crypto.randomUUID();
  const assignId3 = crypto.randomUUID();

  const now = new Date();
  const due1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const due2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  const due3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  await query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_url, target_type, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [
      assignId1,
      'Distributed Systems Milestone 1 - Architectural Blueprint',
      'Design and document a high-availability microservices architecture with load balancing, caching, and database replication. Submit full system diagrams and specifications via the class OneDrive folder.',
      due1,
      'https://onedrive.live.com/?id=academic-dist-sys-m1-joineazy',
      'ALL',
      adminId1,
    ]
  );

  await query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_url, target_type, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [
      assignId2,
      'Cloud Containerization & Kubernetes Cluster Orchestration Lab',
      'Package a multi-tier web application into production Docker containers, write Helm charts, and configure ingress routing. Upload zipped manifests and run logs to OneDrive.',
      due2,
      'https://onedrive.live.com/?id=academic-k8s-cloud-joineazy',
      'ALL',
      adminId1,
    ]
  );

  await query(
    `INSERT INTO assignments (id, title, description, due_date, onedrive_url, target_type, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [
      assignId3,
      'Special Research Track: Graph Neural Networks & Social Graphs',
      'Implement a Graph Convolutional Network (GCN) to detect community clusters in academic collaboration datasets. Exclusive research milestone for selected groups.',
      due3,
      'https://onedrive.live.com/?id=academic-gnn-research-joineazy',
      'GROUPS',
      adminId2,
    ]
  );

  // Assignment 3 is targeted specifically to Group 1 (Team Alpha)
  await query(
    `INSERT INTO assignment_groups (id, assignment_id, group_id)
     VALUES ($1, $2, $3)`,
    [crypto.randomUUID(), assignId3, groupId1]
  );

  console.log(' Created assignments and group mappings.');

  // 5. Seed Submissions
  // Group 1 submitted Assignment 1
  await query(
    `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())`,
    [
      crypto.randomUUID(),
      assignId1,
      groupId1,
      'SUBMITTED',
      studentId1, // Alice confirmed
      'Successfully verified and uploaded the architecture blueprint to OneDrive folder.',
    ]
  );

  // Group 2 is pending for Assignment 1
  await query(
    `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW(), NOW())`,
    [crypto.randomUUID(), assignId1, groupId2, 'PENDING']
  );

  // Both groups are pending for Assignment 2
  await query(
    `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW(), NOW())`,
    [crypto.randomUUID(), assignId2, groupId1, 'PENDING']
  );

  await query(
    `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW(), NOW())`,
    [crypto.randomUUID(), assignId2, groupId2, 'PENDING']
  );

  // Group 1 pending for Assignment 3
  await query(
    `INSERT INTO submissions (id, assignment_id, group_id, status, submitted_by, submitted_at, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NOW(), NOW())`,
    [crypto.randomUUID(), assignId3, groupId1, 'PENDING']
  );

  console.log(' Created submission records.');

  // 6. Seed Activity Logs
  const logs = [
    {
      userId: adminId1,
      action: 'ASSIGNMENT_CREATED',
      details: 'Prof. Vance created assignment "Distributed Systems Milestone 1"',
    },
    {
      userId: adminId1,
      action: 'ASSIGNMENT_CREATED',
      details: 'Prof. Vance created assignment "Cloud Containerization & Kubernetes Cluster Orchestration Lab"',
    },
    {
      userId: studentId1,
      action: 'GROUP_CREATED',
      details: 'Alice Johnson formed group "Team Alpha" (Code: GRP-ALPHA)',
    },
    {
      userId: studentId1,
      action: 'MEMBER_ADDED',
      details: 'Alice Johnson added Bob Smith to Team Alpha',
    },
    {
      userId: studentId1,
      action: 'SUBMISSION_CONFIRMED',
      details: 'Alice Johnson declared and confirmed submission for "Distributed Systems Milestone 1"',
    },
  ];

  for (const log of logs) {
    await query(
      `INSERT INTO activity_logs (id, user_id, action, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [crypto.randomUUID(), log.userId, log.action, log.details]
    );
  }

  console.log(' Activity logs seeded.');
  console.log('🎉 Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

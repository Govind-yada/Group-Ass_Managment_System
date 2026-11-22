const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { validate } = require('../middleware/validate');
const { createGroupSchema, addMemberSchema, removeMemberSchema } = require('../validators/groupValidator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All group routes require authentication
router.use(authenticate);

// Student creates a new group
router.post('/', requireRole('STUDENT'), validate(createGroupSchema), groupController.createGroup);

// Get authenticated student's active group
router.get('/my-group', groupController.getMyGroup);

// List/search groups (general directory)
router.get('/', groupController.listGroups);

// Get group by ID
router.get('/:id', groupController.getGroupById);

// Add member by email or student ID
router.post('/:id/members', validate(addMemberSchema), groupController.addMember);

// Remove member from group
router.delete('/:id/members/:userId', validate(removeMemberSchema), groupController.removeMember);

module.exports = router;

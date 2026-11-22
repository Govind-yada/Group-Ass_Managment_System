const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { validate } = require('../middleware/validate');
const { createAssignmentSchema, updateAssignmentSchema } = require('../validators/assignmentValidator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(authenticate);

// Get assignments (filtered according to role: student sees group/all, admin sees all)
router.get('/', assignmentController.getAssignments);

// Get single assignment details
router.get('/:id', assignmentController.getAssignmentById);

// Admin only: create assignment
router.post('/', requireRole('ADMIN'), validate(createAssignmentSchema), assignmentController.createAssignment);

// Admin only: update assignment
router.put('/:id', requireRole('ADMIN'), validate(updateAssignmentSchema), assignmentController.updateAssignment);

// Admin only: delete assignment
router.delete('/:id', requireRole('ADMIN'), assignmentController.deleteAssignment);

module.exports = router;

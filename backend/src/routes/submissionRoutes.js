const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { validate } = require('../middleware/validate');
const { confirmSubmissionSchema } = require('../validators/submissionValidator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(authenticate);

// Student confirms submission declaration for an assignment
router.post(
  '/:assignmentId/confirm',
  requireRole('STUDENT'),
  validate(confirmSubmissionSchema),
  submissionController.confirmSubmission
);

// Get submission status for an assignment
router.get('/:assignmentId', submissionController.getSubmissionStatus);

// Get authenticated student's group submission history
router.get('/history/my', requireRole('STUDENT'), submissionController.getStudentHistory);

module.exports = router;

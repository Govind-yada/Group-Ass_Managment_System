const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All admin routes strictly require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/submissions', adminController.getSubmissions);
router.get('/groups', adminController.getGroups);

module.exports = router;

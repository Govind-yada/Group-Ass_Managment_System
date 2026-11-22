const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const groupRoutes = require('./groupRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const submissionRoutes = require('./submissionRoutes');
const adminRoutes = require('./adminRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Joineazy API',
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

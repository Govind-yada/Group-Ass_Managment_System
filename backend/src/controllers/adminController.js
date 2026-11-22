const adminService = require('../services/adminService');
const { successResponse } = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getAdminDashboardStats();
    return successResponse(res, stats, 'Admin dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminService.getAdminAnalytics();
    return successResponse(res, analytics, 'Admin analytics retrieved');
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { search, status, assignmentId } = req.query;
    const submissions = await adminService.getSubmissionMonitoring({ search, status, assignmentId });
    return successResponse(res, submissions, 'Submission monitoring records retrieved');
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const { search } = req.query;
    const groups = await adminService.getAdminGroups({ search });
    return successResponse(res, groups, 'Admin groups retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAnalytics,
  getSubmissions,
  getGroups,
};

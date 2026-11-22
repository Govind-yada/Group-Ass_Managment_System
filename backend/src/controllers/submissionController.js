const submissionService = require('../services/submissionService');
const { successResponse } = require('../utils/apiResponse');

const confirmSubmission = async (req, res, next) => {
  try {
    const result = await submissionService.confirmSubmission(req.params.assignmentId, req.body, req.user);
    return successResponse(res, result, 'Assignment submission declared and confirmed successfully');
  } catch (error) {
    next(error);
  }
};

const getSubmissionStatus = async (req, res, next) => {
  try {
    const result = await submissionService.getSubmissionStatus(req.params.assignmentId, req.user);
    return successResponse(res, result, 'Submission status retrieved');
  } catch (error) {
    next(error);
  }
};

const getStudentHistory = async (req, res, next) => {
  try {
    const history = await submissionService.getStudentSubmissionHistory(req.user);
    return successResponse(res, history, 'Submission history retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmSubmission,
  getSubmissionStatus,
  getStudentHistory,
};

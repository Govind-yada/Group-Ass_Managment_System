const assignmentService = require('../services/assignmentService');
const { successResponse } = require('../utils/apiResponse');

const getAssignments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const assignments = await assignmentService.getAssignmentsForUser(req.user, {
      statusFilter: status,
      search,
    });
    return successResponse(res, assignments, 'Assignments retrieved');
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.user);
    return successResponse(res, assignment, 'Assignment details retrieved');
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body, req.user);
    return successResponse(res, assignment, 'Assignment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body, req.user);
    return successResponse(res, assignment, 'Assignment updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const result = await assignmentService.deleteAssignment(req.params.id, req.user);
    return successResponse(res, result, 'Assignment deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};

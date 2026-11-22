const groupService = require('../services/groupService');
const { successResponse } = require('../utils/apiResponse');

const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(req.user, req.body);
    return successResponse(res, group, 'Group created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyGroup = async (req, res, next) => {
  try {
    const group = await groupService.getMyGroup(req.user.id);
    return successResponse(res, group, 'Group retrieved');
  } catch (error) {
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await groupService.getGroupById(req.params.id, req.user.id);
    return successResponse(res, group, 'Group details retrieved');
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const group = await groupService.addMember(req.params.id, req.body, req.user);
    return successResponse(res, group, 'Member added to group successfully');
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const result = await groupService.removeMember(req.params.id, req.params.userId, req.user);
    return successResponse(res, result, 'Member removed from group successfully');
  } catch (error) {
    next(error);
  }
};

const listGroups = async (req, res, next) => {
  try {
    const { search, limit, offset } = req.query;
    const groups = await groupService.listAllGroups({
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return successResponse(res, groups, 'Groups retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getMyGroup,
  getGroupById,
  addMember,
  removeMember,
  listGroups,
};

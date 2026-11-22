const authService = require('../services/authService');
const { successResponse } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerStudent(req.body);
    return successResponse(res, result, 'Student registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return successResponse(res, user, 'Current user retrieved');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    return successResponse(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};

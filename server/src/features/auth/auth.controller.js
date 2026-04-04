const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, result, "Registration successful"));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, result, "Login successful"));
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  res.status(200).json(new ApiResponse(200, result, "Profile fetched"));
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

module.exports = { register, login, getMe, changePassword };

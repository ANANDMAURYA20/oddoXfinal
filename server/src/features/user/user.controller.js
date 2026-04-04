const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const userService = require("./user.service");

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, user, "Staff member created"));
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userService.listUsers(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.status(200).json(new ApiResponse(200, result, "Staff list fetched"));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, user, "Staff member fetched"));
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, user, "Staff member updated"));
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Staff member deactivated"));
});

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };

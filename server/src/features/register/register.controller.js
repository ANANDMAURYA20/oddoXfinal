const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const registerService = require("./register.service");

const openRegister = asyncHandler(async (req, res) => {
  const session = await registerService.openRegister(req.tenantId, req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, session, "Register opened successfully"));
});

const getActiveSession = asyncHandler(async (req, res) => {
  const session = await registerService.getActiveSession(req.tenantId, req.user.id);
  res.status(200).json(new ApiResponse(200, session, session ? "Active session found" : "No active session"));
});

const getSessionSummary = asyncHandler(async (req, res) => {
  const summary = await registerService.getSessionSummary(req.tenantId, req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, summary, "Session summary fetched"));
});

const closeRegister = asyncHandler(async (req, res) => {
  const session = await registerService.closeRegister(req.tenantId, req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, session, "Register closed successfully"));
});

const listSessions = asyncHandler(async (req, res) => {
  const { page, limit, cashierId } = req.query;
  const result = await registerService.listSessions(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    cashierId,
  });
  res.status(200).json(new ApiResponse(200, result, "Sessions fetched"));
});

module.exports = { openRegister, getActiveSession, getSessionSummary, closeRegister, listSessions };

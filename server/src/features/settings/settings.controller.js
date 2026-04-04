const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const settingsService = require("./settings.service");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.tenantId);
  res.status(200).json(new ApiResponse(200, settings, "Settings fetched"));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.tenantId, req.body);
  res.status(200).json(new ApiResponse(200, settings, "Settings updated"));
});

module.exports = { getSettings, updateSettings };
